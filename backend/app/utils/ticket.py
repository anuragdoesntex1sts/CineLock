import io
import os
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings


def generate_qr_code(data: str) -> bytes:
    """Generate QR code image bytes from data string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()


def generate_ticket_pdf(booking_data: dict, movie_data: dict, theater_data: dict, show_data: dict) -> bytes:
    """Generate a PDF ticket with ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TicketTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#E50914'),  # Netflix red
        alignment=1,  # Center
        spaceAfter=10,
    )

    subtitle_style = ParagraphStyle(
        'TicketSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#666666'),
        alignment=1,
        spaceAfter=20,
    )

    label_style = ParagraphStyle(
        'TicketLabel',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#888888'),
        fontName='Helvetica-Bold',
    )

    value_style = ParagraphStyle(
        'TicketValue',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#111111'),
        fontName='Helvetica-Bold',
    )

    story = []

    # Header
    story.append(Paragraph(f"<b>{settings.APP_NAME}</b> E-TICKET", title_style))
    story.append(Paragraph(f"Booking Reference: <b>{booking_data.get('booking_reference')}</b>", subtitle_style))
    story.append(Spacer(1, 10))

    # Movie & Theater Info
    info_data = [
        [Paragraph("MOVIE", label_style), Paragraph("THEATER", label_style)],
        [Paragraph(movie_data.get('title', 'Movie'), value_style), Paragraph(theater_data.get('name', 'Theater'), value_style)],
        [Paragraph("SHOWTIME", label_style), Paragraph("SCREEN & SEATS", label_style)],
        [Paragraph(show_data.get('start_time', 'Time'), value_style), Paragraph(f"{show_data.get('screen_name', 'Screen')} | Seats: {', '.join([s['seat_id'] for s in booking_data.get('seats', [])])}", value_style)],
        [Paragraph("TOTAL AMOUNT", label_style), Paragraph("PAYMENT STATUS", label_style)],
        [Paragraph(f"₹ {booking_data.get('total_amount', 0):.2f}", value_style), Paragraph("PAID (Confirmed)", value_style)],
    ]

    t = Table(info_data, colWidths=[250, 250])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8F9FA')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E0E0E0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
    ]))

    story.append(t)
    story.append(Spacer(1, 30))

    # QR Code
    qr_bytes = generate_qr_code(f"CINELOCK-TICKET:{booking_data.get('booking_reference')}")
    qr_io = io.BytesIO(qr_bytes)
    qr_img = Image(qr_io, width=120, height=120)
    qr_img.hAlign = 'CENTER'

    story.append(qr_img)
    story.append(Spacer(1, 10))
    story.append(Paragraph("Scan QR code at theater entrance", ParagraphStyle('QRNote', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#666666'), alignment=1)))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()