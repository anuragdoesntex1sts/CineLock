import json
import os
import portalocker
from typing import TypeVar, Generic, List, Optional, Type, Dict, Any
from pathlib import Path
import threading


T = TypeVar("T")


class JSONFileRepository(Generic[T]):
    def __init__(self, file_path: str, model_class: Type[T], id_field: str = "id"):
        self.file_path = Path(file_path)
        self.model_class = model_class
        self.id_field = id_field
        self._lock = threading.RLock()
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            with open(self.file_path, "w") as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict[str, Any]]:
        with open(self.file_path, "r") as f:
            portalocker.lock(f, portalocker.LOCK_SH)
            try:
                data = json.load(f)
                return data if isinstance(data, list) else []
            finally:
                portalocker.unlock(f)

    def _write_data(self, data: List[Dict[str, Any]]):
        with open(self.file_path, "w") as f:
            portalocker.lock(f, portalocker.LOCK_EX)
            try:
                json.dump(data, f, indent=2, default=str)
            finally:
                portalocker.unlock(f)

    def _to_model(self, data: Dict[str, Any]) -> T:
        if hasattr(self.model_class, "from_dict"):
            return self.model_class.from_dict(data)
        return self.model_class(**data)

    def _to_dict(self, model: T) -> Dict[str, Any]:
        if hasattr(model, "to_dict"):
            return model.to_dict()
        return model.__dict__

    def get_all(self) -> List[T]:
        with self._lock:
            data = self._read_data()
            return [self._to_model(item) for item in data]

    def get_by_id(self, id_value: str) -> Optional[T]:
        with self._lock:
            data = self._read_data()
            for item in data:
                if item.get(self.id_field) == id_value:
                    return self._to_model(item)
            return None

    def get_by_field(self, field: str, value: Any) -> List[T]:
        with self._lock:
            data = self._read_data()
            return [self._to_model(item) for item in data if item.get(field) == value]

    def get_one_by_field(self, field: str, value: Any) -> Optional[T]:
        with self._lock:
            data = self._read_data()
            for item in data:
                if item.get(field) == value:
                    return self._to_model(item)
            return None

    def create(self, model: T) -> T:
        with self._lock:
            data = self._read_data()
            model_dict = self._to_dict(model)
            data.append(model_dict)
            self._write_data(data)
            return model

    def bulk_create(self, models: List[T]) -> List[T]:
        with self._lock:
            data = self._read_data()
            for model in models:
                data.append(self._to_dict(model))
            self._write_data(data)
            return models

    def update(self, model: T) -> Optional[T]:
        with self._lock:
            data = self._read_data()
            id_value = getattr(model, self.id_field)
            for i, item in enumerate(data):
                if item.get(self.id_field) == id_value:
                    data[i] = self._to_dict(model)
                    self._write_data(data)
                    return model
            return None

    def delete(self, id_value: str) -> bool:
        with self._lock:
            data = self._read_data()
            original_len = len(data)
            data = [item for item in data if item.get(self.id_field) != id_value]
            if len(data) < original_len:
                self._write_data(data)
                return True
            return False

    def delete_many(self, id_values: List[str]) -> int:
        with self._lock:
            data = self._read_data()
            original_len = len(data)
            data = [item for item in data if item.get(self.id_field) not in id_values]
            deleted = original_len - len(data)
            if deleted > 0:
                self._write_data(data)
            return deleted

    def find_and_update(self, field: str, value: Any, update_fn) -> Optional[T]:
        with self._lock:
            data = self._read_data()
            for i, item in enumerate(data):
                if item.get(field) == value:
                    model = self._to_model(item)
                    updated_model = update_fn(model)
                    if updated_model:
                        data[i] = self._to_dict(updated_model)
                        self._write_data(data)
                        return updated_model
            return None

    def atomic_operation(self, operation_fn):
        with self._lock:
            data = self._read_data()
            result = operation_fn(data)
            self._write_data(data)
            return result