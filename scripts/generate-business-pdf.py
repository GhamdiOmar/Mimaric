#!/usr/bin/env python3
"""
Mimaric Business Documentation PDF Generator
Generates a ~30-page branded A4 PDF with full business documentation.
"""

import os
import sys
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Frame, Table, TableStyle
from reportlab.lib import colors

# ─── PATHS ───────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(ROOT, "scripts", "fonts")
BRAND_DIR = os.path.join(ROOT, "apps", "web", "public", "assets", "brand")
SCREENSHOTS_DIR = os.path.join(ROOT, "apps", "web", "public", "assets", "screenshots")
OUTPUT_DIR = os.path.join(ROOT, "docs")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "Mimaric-Business-Documentation-v1.2.pdf")
LOGO_PATH = os.path.join(BRAND_DIR, "Mimaric_Official_Logo_transparent.png")

# ─── COLORS ──────────────────────────────────────────────────────────────────
NAVY = HexColor("#182840")
GREEN = HexColor("#107840")
BRIGHT_GREEN = HexColor("#20A050")
GOLD = HexColor("#D4AF37")
ALABASTER = HexColor("#F8F9FA")
SLATE = HexColor("#4A5568")
WHITE = HexColor("#FFFFFF")
LIGHT_GRAY = HexColor("#E2E8F0")
NAVY_LIGHT = HexColor("#1E3352")
CARD_SHADOW = HexColor("#00000012")  # 7% opacity black for subtle shadow
CARD_BG = HexColor("#FFFFFF")
SECTION_BG = HexColor("#F7FAFC")  # Very light blue-gray for section backgrounds

# ─── PAGE SETUP ──────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4  # 595.28 x 841.89 points
MARGIN_L = 25 * mm
MARGIN_R = 25 * mm
MARGIN_T = 22 * mm
MARGIN_B = 25 * mm
USABLE_W = PAGE_W - MARGIN_L - MARGIN_R
USABLE_H = PAGE_H - MARGIN_T - MARGIN_B
HEADER_H = 15 * mm
FOOTER_H = 12 * mm

# ─── FONTS ───────────────────────────────────────────────────────────────────
def register_fonts():
    dm_regular = os.path.join(FONTS_DIR, "DMSans-Variable.ttf")
    arabic_regular = os.path.join(FONTS_DIR, "IBMPlexArabic-Regular.ttf")
    pdfmetrics.registerFont(TTFont("DMSans", dm_regular, subfontIndex=0))
    pdfmetrics.registerFont(TTFont("IBMPlexArabic", arabic_regular))

# ─── ARABIC HELPER ───────────────────────────────────────────────────────────
def ar(text):
    """Reshape and reorder Arabic text for correct PDF rendering."""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

# ─── SECTION TRACKING ────────────────────────────────────────────────────────
current_section = [""]
page_num = [0]

# ─── DRAWING HELPERS ─────────────────────────────────────────────────────────

def draw_header(c):
    """Draw page header with logo and section name."""
    y = PAGE_H - 14 * mm
    # Navy line
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    # Small logo
    try:
        c.drawImage(LOGO_PATH, MARGIN_L, y + 1.5 * mm, width=28 * mm, height=12 * mm,
                     preserveAspectRatio=True, mask="auto")
    except Exception:
        pass
    # Section name
    c.setFont("DMSans", 7.5)
    c.setFillColor(SLATE)
    c.drawRightString(PAGE_W - MARGIN_R, y + 3 * mm, current_section[0])

def draw_footer(c):
    """Draw page footer with version, page number, confidential."""
    y = MARGIN_B - 8 * mm
    # Green line
    c.setStrokeColor(GREEN)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, y + 5 * mm, PAGE_W - MARGIN_R, y + 5 * mm)
    c.setFont("DMSans", 7)
    c.setFillColor(SLATE)
    c.drawString(MARGIN_L, y, "Mimaric Business Documentation v1.2.0")
    c.drawCentredString(PAGE_W / 2, y, str(page_num[0]))
    c.drawRightString(PAGE_W - MARGIN_R, y, "Confidential")

def new_page(c, section=None):
    """Start a new page with header and footer."""
    if page_num[0] > 0:
        c.showPage()
    page_num[0] += 1
    if section:
        current_section[0] = section
    draw_header(c)
    draw_footer(c)

def draw_section_title(c, title, subtitle=None, section_num=None, y=None):
    """Draw a section title with green left-bar accent and optional gold badge."""
    if y is None:
        y = PAGE_H - MARGIN_T - HEADER_H - 5 * mm
    # Green left bar — taller and wider for stronger visual weight
    c.setFillColor(GREEN)
    c.roundRect(MARGIN_L, y - 4, 5, 34, 2, fill=1, stroke=0)
    # Gold section number badge — larger
    if section_num is not None:
        cx = MARGIN_L + 22
        cy = y + 14
        c.setFillColor(GOLD)
        c.circle(cx, cy, 13, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DMSans", 12)
        c.drawCentredString(cx, cy - 4, str(section_num))
    # Title — larger 26pt for stronger hierarchy
    x_off = MARGIN_L + 16 if section_num is None else MARGIN_L + 42
    c.setFillColor(NAVY)
    c.setFont("DMSans", 26)
    c.drawString(x_off, y + 4, title)
    # Subtitle — slightly larger, lighter weight feel
    if subtitle:
        c.setFont("DMSans", 11)
        c.setFillColor(SLATE)
        c.drawString(x_off, y - 14, subtitle)
    # Green horizontal rule — slightly thicker
    rule_y = y - 22 if subtitle else y - 10
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.2)
    c.line(MARGIN_L, rule_y, PAGE_W - MARGIN_R, rule_y)
    return rule_y - 10

def draw_text_block(c, text, x, y, max_width=None, font="DMSans", size=10, color=SLATE, leading=14):
    """Draw wrapped text block. Returns the y position after text."""
    if max_width is None:
        max_width = USABLE_W
    style = ParagraphStyle(
        "body", fontName=font, fontSize=size, textColor=color,
        leading=leading, alignment=TA_JUSTIFY, wordWrap="CJK"
    )
    p = Paragraph(text, style)
    w, h = p.wrap(max_width, 500)
    p.drawOn(c, x, y - h)
    return y - h

def draw_bullet(c, text, x, y, bullet_color=GREEN, max_width=None, font="DMSans", size=9.5):
    """Draw a bullet point with green bullet."""
    if max_width is None:
        max_width = USABLE_W - 16
    # Green bullet circle
    c.setFillColor(bullet_color)
    c.circle(x + 4, y + 3, 2.5, fill=1, stroke=0)
    # Text
    style = ParagraphStyle(
        "bullet", fontName=font, fontSize=size, textColor=SLATE,
        leading=13, alignment=TA_LEFT
    )
    p = Paragraph(text, style)
    w, h = p.wrap(max_width, 300)
    p.drawOn(c, x + 14, y + 6 - h)
    return y - h - 2

def draw_module_card(c, name, arabic_name, description, x, y, w, h):
    """Draw a module card with name, Arabic name, and description."""
    # Shadow for depth
    draw_card_shadow(c, x, y, w, h, radius=8)
    # Card background — white instead of flat gray
    c.setFillColor(CARD_BG)
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.4)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    # Green top accent — thicker for visual weight
    c.setFillColor(GREEN)
    c.roundRect(x, y + h - 5, w, 5, 3, fill=1, stroke=0)
    # Module name — larger for hierarchy
    c.setFillColor(NAVY)
    c.setFont("DMSans", 12)
    c.drawString(x + 10, y + h - 22, name)
    # Arabic name
    c.setFont("IBMPlexArabic", 9)
    c.setFillColor(GOLD)
    ar_text = ar(arabic_name)
    c.drawRightString(x + w - 10, y + h - 22, ar_text)
    # Thin separator line
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.3)
    c.line(x + 10, y + h - 28, x + w - 10, y + h - 28)
    # Description
    style = ParagraphStyle(
        "card_desc", fontName="DMSans", fontSize=8.5, textColor=SLATE,
        leading=11.5, alignment=TA_LEFT
    )
    p = Paragraph(description, style)
    pw, ph = p.wrap(w - 20, h - 36)
    p.drawOn(c, x + 10, y + h - 34 - ph)

def draw_workflow_box(c, text, x, y, w=None, h=20, fill_color=NAVY):
    """Draw a rounded workflow step box."""
    if w is None:
        w = c.stringWidth(text, "DMSans", 7.5) + 14
    c.setFillColor(fill_color)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DMSans", 7.5)
    c.drawCentredString(x + w / 2, y + 6, text)
    return x + w

def draw_workflow_arrow(c, x, y, length=10):
    """Draw a small green arrow."""
    c.setStrokeColor(GREEN)
    c.setFillColor(GREEN)
    c.setLineWidth(1.2)
    c.line(x, y + 10, x + length, y + 10)
    # Arrowhead
    c.line(x + length - 3, y + 13, x + length, y + 10)
    c.line(x + length - 3, y + 7, x + length, y + 10)

def draw_role_card(c, role_en, role_ar, description, user_story, permissions, x, y, w, h):
    """Draw a user role card."""
    # Shadow for depth
    draw_card_shadow(c, x, y, w, h, radius=8)
    # Card
    c.setFillColor(CARD_BG)
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.4)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    # Green left accent — wider for stronger visual cue
    c.setFillColor(GREEN)
    c.roundRect(x, y, 5, h, 3, fill=1, stroke=0)
    # Role name — larger
    c.setFillColor(NAVY)
    c.setFont("DMSans", 12)
    c.drawString(x + 14, y + h - 16, role_en)
    # Arabic name
    c.setFont("IBMPlexArabic", 9)
    c.setFillColor(GOLD)
    ar_text = ar(role_ar)
    c.drawRightString(x + w - 10, y + h - 16, ar_text)
    # Description — slightly bolder feel
    c.setFont("DMSans", 8.5)
    c.setFillColor(SLATE)
    c.drawString(x + 14, y + h - 30, description)
    # User story (italic-like)
    style = ParagraphStyle(
        "story", fontName="DMSans", fontSize=8, textColor=SLATE,
        leading=11, alignment=TA_LEFT
    )
    p = Paragraph(f'<i>"{user_story}"</i>', style)
    pw, ph = p.wrap(w - 28, 60)
    p.drawOn(c, x + 14, y + h - 38 - ph)
    # Permission badges
    badge_y = y + 8
    badge_x = x + 14
    for perm in permissions:
        pw = c.stringWidth(perm, "DMSans", 6.5) + 10
        if perm.startswith("No"):
            c.setFillColor(HexColor("#FEE2E2"))
            tc = HexColor("#991B1B")
        else:
            c.setFillColor(HexColor("#D1FAE5"))
            tc = HexColor("#065F46")
        c.roundRect(badge_x, badge_y, pw, 13, 3, fill=1, stroke=0)
        c.setFont("DMSans", 6.5)
        c.setFillColor(tc)
        c.drawCentredString(badge_x + pw / 2, badge_y + 3.5, perm)
        badge_x += pw + 4

def draw_usp_card(c, number, title, bullets, x, y, w, h):
    """Draw a USP card with gold top accent and shadow depth."""
    # Shadow for depth
    draw_card_shadow(c, x, y, w, h, radius=8)
    # Card
    c.setFillColor(CARD_BG)
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.4)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    # Gold top accent — thicker
    c.setFillColor(GOLD)
    c.roundRect(x, y + h - 5, w, 5, 3, fill=1, stroke=0)
    # Number badge — larger
    c.setFillColor(GOLD)
    c.circle(x + 20, y + h - 22, 12, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("DMSans", 12)
    c.drawCentredString(x + 20, y + h - 26, str(number))
    # Title — larger for hierarchy
    c.setFillColor(NAVY)
    c.setFont("DMSans", 12)
    c.drawString(x + 38, y + h - 26, title)
    # Separator
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.3)
    c.line(x + 12, y + h - 36, x + w - 12, y + h - 36)
    # Bullets
    bullet_y = y + h - 46
    for b in bullets:
        style = ParagraphStyle("usp_b", fontName="DMSans", fontSize=8.5, textColor=SLATE, leading=11)
        # Green check bullet
        c.setFillColor(GREEN)
        c.circle(x + 16, bullet_y + 3, 2.5, fill=1, stroke=0)
        p = Paragraph(b, style)
        pw, ph = p.wrap(w - 34, 40)
        p.drawOn(c, x + 24, bullet_y + 6 - ph)
        bullet_y -= ph + 2

def draw_screenshot_page(c, img_path, caption_title, caption_body, capabilities):
    """Draw a full screenshot page with caption."""
    y_start = PAGE_H - MARGIN_T - HEADER_H - 8 * mm
    # Section mini-header — larger for hierarchy
    c.setFillColor(NAVY)
    c.setFont("DMSans", 18)
    c.drawString(MARGIN_L, y_start, caption_title)
    y = y_start - 10
    # Green line under title
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.2)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 8
    # Screenshot image
    try:
        img_w = USABLE_W
        img_h = img_w * 0.625  # Approximate 16:10 ratio
        if y - img_h < MARGIN_B + FOOTER_H + 120:
            img_h = y - MARGIN_B - FOOTER_H - 130
            img_w = img_h / 0.625
        c.drawImage(img_path, MARGIN_L, y - img_h, width=img_w, height=img_h,
                     preserveAspectRatio=True, mask="auto")
        y -= img_h + 4
    except Exception as e:
        c.setFont("DMSans", 10)
        c.setFillColor(SLATE)
        c.drawString(MARGIN_L, y - 20, f"[Screenshot: {os.path.basename(img_path)}]")
        y -= 30
    # Green divider
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 14
    # Caption
    y = draw_text_block(c, caption_body, MARGIN_L, y, max_width=USABLE_W,
                         font="DMSans", size=9.5, color=SLATE, leading=13)
    y -= 10
    # Capabilities
    c.setFillColor(NAVY)
    c.setFont("DMSans", 12)
    c.drawString(MARGIN_L, y, "Key Capabilities")
    y -= 8
    for cap in capabilities:
        y = draw_bullet(c, cap, MARGIN_L, y, size=8.5)

def draw_card_shadow(c, x, y, w, h, radius=6, offset=3, layers=3):
    """Draw a multi-layer soft shadow behind a card for depth effect."""
    for i in range(layers, 0, -1):
        alpha = 0.04 * i  # Decreasing opacity
        spread = offset * (layers - i + 1) * 0.6
        c.saveState()
        c.setFillColor(HexColor("#000000"))
        c.setFillAlpha(alpha)
        c.roundRect(x + spread, y - spread, w, h, radius, fill=1, stroke=0)
        c.restoreState()


def draw_stats_bar(c, stats, y):
    """Draw a horizontal stats highlight bar with shadow."""
    bar_h = 36
    # Shadow
    draw_card_shadow(c, MARGIN_L, y, USABLE_W, bar_h, radius=8, offset=2, layers=2)
    c.setFillColor(NAVY)
    c.roundRect(MARGIN_L, y, USABLE_W, bar_h, 8, fill=1, stroke=0)
    seg_w = USABLE_W / len(stats)
    for i, stat in enumerate(stats):
        cx = MARGIN_L + seg_w * i + seg_w / 2
        # Split stat into number and label
        parts = stat.split(" ", 1)
        if len(parts) == 2:
            num, label = parts
            c.setFillColor(GOLD)
            c.setFont("DMSans", 14)
            c.drawCentredString(cx - 2, y + 12, num)
            c.setFillColor(WHITE)
            c.setFont("DMSans", 9)
            nw = c.stringWidth(num, "DMSans", 14)
            c.drawString(cx + nw / 2 + 2, y + 13, label)
        else:
            c.setFillColor(WHITE)
            c.setFont("DMSans", 11)
            c.drawCentredString(cx, y + 12, stat)
        if i < len(stats) - 1:
            c.setStrokeColor(HexColor("#2A4060"))
            c.setLineWidth(0.5)
            c.line(MARGIN_L + seg_w * (i + 1), y + 6, MARGIN_L + seg_w * (i + 1), y + bar_h - 6)
    return y - 12


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE BUILDERS
# ═══════════════════════════════════════════════════════════════════════════════

def build_cover(c):
    """Page 1: Cover page."""
    page_num[0] += 1
    # Full navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Subtle gradient overlay
    c.setFillColor(HexColor("#0D1B2A"))
    c.rect(0, 0, PAGE_W, PAGE_H * 0.3, fill=1, stroke=0)
    # Logo with white backdrop for readability on dark background
    logo_w = 120 * mm
    logo_h = logo_w * 0.65  # Crop vertically — logo content is wider than tall
    logo_x = (PAGE_W - logo_w) / 2
    logo_y = PAGE_H * 0.48
    try:
        # White rounded card behind logo so dark text is visible
        pad_x = 10 * mm
        pad_y = 6 * mm
        c.saveState()
        c.setFillColor(WHITE)
        c.setFillAlpha(0.93)
        c.roundRect(logo_x - pad_x, logo_y - pad_y, logo_w + 2 * pad_x, logo_h + 2 * pad_y, 12, fill=1, stroke=0)
        c.restoreState()
        c.drawImage(LOGO_PATH, logo_x, logo_y, width=logo_w, height=logo_h,
                     preserveAspectRatio=True, mask="auto")
    except Exception:
        c.setFillColor(WHITE)
        c.setFont("DMSans", 36)
        c.drawCentredString(PAGE_W / 2, logo_y + 20, "MIMARIC")
    # Green accent line
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    line_y = logo_y - pad_y - 20
    c.line(PAGE_W / 2 - 60, line_y, PAGE_W / 2 + 60, line_y)
    # Title
    c.setFillColor(WHITE)
    c.setFont("DMSans", 26)
    c.drawCentredString(PAGE_W / 2, line_y - 40, "Business Documentation")
    # Subtitle
    c.setFillColor(GOLD)
    c.setFont("DMSans", 13)
    c.drawCentredString(PAGE_W / 2, line_y - 65, "Saudi PropTech Platform")
    # Gold accent dots
    c.setFillColor(GOLD)
    for dx in [-40, -20, 0, 20, 40]:
        c.circle(PAGE_W / 2 + dx, line_y - 88, 1.5, fill=1, stroke=0)
    # Version at bottom
    c.setFillColor(WHITE)
    c.setFont("DMSans", 10)
    c.drawCentredString(PAGE_W / 2, 45, "v1.2.0  |  March 2026")
    # Confidential
    c.setFillColor(HexColor("#FFFFFF60"))
    c.setFont("DMSans", 7)
    c.drawCentredString(PAGE_W / 2, 28, "CONFIDENTIAL")


def build_doc_info(c):
    """Page 2: Document info / inside cover."""
    new_page(c, "Document Information")
    y = PAGE_H - MARGIN_T - HEADER_H - 10 * mm
    # Small logo right
    try:
        c.drawImage(LOGO_PATH, PAGE_W - MARGIN_R - 50 * mm, y - 5, width=50 * mm,
                     height=24 * mm, preserveAspectRatio=True, mask="auto")
    except Exception:
        pass
    # Title
    c.setFillColor(NAVY)
    c.setFont("DMSans", 24)
    c.drawString(MARGIN_L, y, "Document Information")
    y -= 32
    # Metadata table
    meta = [
        ("Document Title", "Mimaric Business Documentation"),
        ("Version", "1.2.0"),
        ("Date", "March 2026"),
        ("Prepared By", "Mimaric PropTech"),
        ("Classification", "Confidential"),
    ]
    for label, value in meta:
        c.setFillColor(SLATE)
        c.setFont("DMSans", 9)
        c.drawString(MARGIN_L, y, label)
        c.setFillColor(NAVY)
        c.setFont("DMSans", 10)
        c.drawString(MARGIN_L + 120, y, value)
        y -= 18
    y -= 15
    # Green divider
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
    y -= 20
    # Intro paragraph
    intro = (
        "This document provides a comprehensive overview of the Mimaric platform "
        "- a Saudi-first property management solution covering the full real estate lifecycle. "
        "It is intended for stakeholders, partners, and decision-makers evaluating the platform "
        "for real estate development, property management, and facility operations in Saudi Arabia."
    )
    y = draw_text_block(c, intro, MARGIN_L, y, font="DMSans", size=10, color=SLATE, leading=15)


def build_toc(c):
    """Page 3: Table of Contents."""
    new_page(c, "Table of Contents")
    y = PAGE_H - MARGIN_T - HEADER_H - 5 * mm
    c.setFillColor(NAVY)
    c.setFont("DMSans", 26)
    c.drawString(MARGIN_L, y, "Contents")
    y -= 32
    # Green line
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.line(MARGIN_L, y + 10, PAGE_W - MARGIN_R, y + 10)
    y -= 5

    sections = [
        ("1", "Executive Summary", "4"),
        ("2", "Platform Modules", "6"),
        ("3", "Business Workflows", "12"),
        ("4", "User Stories & Use Cases", "15"),
        ("5", "Unique Selling Propositions", "19"),
        ("6", "Platform Screenshots", "21"),
        ("7", "Basic User Guideline", "27"),
    ]
    for num, title, pg in sections:
        # Green number badge
        c.setFillColor(GREEN)
        c.circle(MARGIN_L + 10, y + 4, 10, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DMSans", 10)
        c.drawCentredString(MARGIN_L + 10, y + 0.5, num)
        # Section name — larger
        c.setFillColor(NAVY)
        c.setFont("DMSans", 13)
        c.drawString(MARGIN_L + 28, y, title)
        # Dotted leader
        c.setStrokeColor(LIGHT_GRAY)
        c.setLineWidth(0.3)
        c.setDash(1, 3)
        text_end = MARGIN_L + 28 + c.stringWidth(title, "DMSans", 13) + 8
        c.line(text_end, y + 3, PAGE_W - MARGIN_R - 25, y + 3)
        c.setDash()
        # Page number
        c.setFillColor(SLATE)
        c.setFont("DMSans", 10)
        c.drawRightString(PAGE_W - MARGIN_R, y, pg)
        y -= 32


def build_executive_summary(c):
    """Pages 4-5: Executive Summary."""
    new_page(c, "Executive Summary")
    y = draw_section_title(c, "Executive Summary", "Platform overview and market positioning", 1)
    y -= 16

    # The Problem
    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "The Problem")
    y -= 10
    problem = (
        "Saudi real estate companies manage property operations across disconnected "
        "spreadsheets, WhatsApp groups, paper forms, and multiple government portals. "
        "This fragmentation causes data loss, compliance gaps with Saudi regulations, "
        "delayed decision-making, and poor tenant and buyer experience."
    )
    y = draw_text_block(c, problem, MARGIN_L, y, size=9.5, leading=13.5)
    y -= 12

    problems = [
        "Disconnected data across spreadsheets, WhatsApp, and paper forms",
        "Compliance gaps across RERA, ZATCA, Ejar, Balady, and Wafi portals",
        "Delayed decision-making from manual data compilation",
        "Poor tenant and buyer experience due to fragmented communication",
    ]
    for p in problems:
        y = draw_bullet(c, p, MARGIN_L, y, bullet_color=HexColor("#E53E3E"))
    y -= 12

    # The Solution
    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "The Solution")
    y -= 10
    solution = (
        "Mimaric is a single Arabic-first platform that unifies every stage of "
        "the property lifecycle under one roof - from land acquisition and project "
        "planning to sales, leasing, maintenance, and financial reporting."
    )
    y = draw_text_block(c, solution, MARGIN_L, y, size=9.5, leading=13.5)
    y -= 10

    solutions = [
        "<b>Eliminate Spreadsheet Chaos</b> - Centralized data for land, projects, units, customers, contracts, and maintenance",
        "<b>Saudi Regulatory Compliance Built-In</b> - RERA, ZATCA, Ejar, Balady, and Wafi integrated into workflows",
        "<b>Data Protection by Design</b> - AES-256-GCM encryption, PDPL/NCA compliance, full audit trails",
        "<b>Bilingual RTL-First</b> - Arabic/English interface with Hijri/Gregorian dates and SAR formatting",
        "<b>Decision Intelligence</b> - Real-time dashboards with pipeline analytics and cost trends",
        "<b>Multi-Tenant Collaboration</b> - 13 roles with 30+ granular permissions and org-scoped data isolation",
    ]
    for s in solutions:
        y = draw_bullet(c, s, MARGIN_L, y)

    # Page 5
    new_page(c, "Executive Summary")
    y = PAGE_H - MARGIN_T - HEADER_H - 10 * mm

    # Target Market
    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "Target Market")
    y -= 24

    targets = [
        ("Real Estate Developers", ar("مطورون عقاريون")),
        ("Property Management Companies", ar("شركات إدارة الأملاك")),
        ("Facility Management Firms", ar("شركات إدارة المرافق")),
        ("Individual Property Owners", ar("ملاك عقارات")),
    ]
    card_w = USABLE_W / 2 - 6
    card_h = 42
    for i, (en, arabic) in enumerate(targets):
        col = i % 2
        row = i // 2
        cx = MARGIN_L + col * (card_w + 12)
        cy = y - row * (card_h + 8)
        # Card with shadow
        draw_card_shadow(c, cx, cy, card_w, card_h, radius=8)
        c.setFillColor(CARD_BG)
        c.setStrokeColor(LIGHT_GRAY)
        c.setLineWidth(0.4)
        c.roundRect(cx, cy, card_w, card_h, 8, fill=1, stroke=1)
        c.setFillColor(GREEN)
        c.roundRect(cx, cy, 5, card_h, 3, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("DMSans", 10)
        c.drawString(cx + 12, cy + card_h - 16, en)
        c.setFont("IBMPlexArabic", 9)
        c.setFillColor(GOLD)
        c.drawRightString(cx + card_w - 8, cy + card_h - 16, arabic)

    y -= 2 * (card_h + 8) + 20

    # Vision 2030
    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "Vision 2030 Alignment")
    y -= 12
    vision = (
        "Mimaric directly supports Saudi Arabia's Vision 2030 digital transformation agenda "
        "by providing e-government integration readiness with Ejar, Balady, ZATCA, and Wafi systems. "
        "The platform enables paperless property management workflows, data-driven decision making, "
        "and regulatory compliance automation - reducing the dependency on manual processes and "
        "paper-based government interactions."
    )
    y = draw_text_block(c, vision, MARGIN_L, y, size=9.5, leading=13.5)
    y -= 36

    # Stats bar
    stats = ["18 Modules", "13 Roles", "58 FAQs", "6 Gov APIs"]
    draw_stats_bar(c, stats, y)


def build_modules(c):
    """Pages 6-11: Platform Modules."""
    card_w = USABLE_W / 2 - 8
    card_h = 82

    domains = [
        ("Property Development", "Core development modules from land to delivery", [
            ("Land Acquisition", "الأراضي", "End-to-end pipeline from identification through due diligence to acquisition, with interactive map picker, suitability scoring, and conversion to project."),
            ("Planning OS", "التخطيط", "GIS-integrated subdivision planning with multiple scenarios, compliance checking against Saudi regulations, feasibility analysis, and 'Promote to Project' workflow."),
            ("Projects", "المشاريع", "Development project management with 14-stage lifecycle stepper across 5 phases, P&amp;L financials tab, building management, and Balady document uploads."),
            ("Unit Matrix", "الوحدات", "Track units across buildings with area, price, type, availability. Unit detail panel shows financial summary (P&amp;L) and linked contract information."),
            ("Site Logs", "سجلات الموقع", "Construction progress tracking with daily logs, inspections, snags, safety reports, and weather entries with severity levels."),
        ]),
        ("Sales & CRM", "Customer acquisition and contract management", [
            ("Customer CRM", "العملاء", "Unified customer database with Kanban pipeline (New, Interested, Qualified, Viewing, Reserved), encrypted PII, and list/card views."),
            ("Reservations", "الحجوزات", "Temporary unit holds with 4-step wizard supporting both traditional units and off-plan inventory items, with expiry management."),
            ("Contracts", "العقود", "Full contract lifecycle (Draft, Sent, Signed, Cancel/Void) with Saudi Ejar lease compliance and Wafi off-plan sale compliance. Auto-generated contract numbers and installment schedules."),
        ]),
        ("Leasing & Finance", "Revenue operations and financial management", [
            ("Rentals", "الإيجارات", "Full tenancy lifecycle with Ejar-compliant lease creation, auto-generated installment schedules, rent collection tracking with overdue alerts."),
            ("Finance", "المالية", "Payment tracking, installment schedules, ZATCA-compliant VAT calculation (15%), revenue KPIs, project-level P&amp;L aggregation."),
            ("Billing", "الاشتراك والفوترة", "SaaS subscription management with 3-tier plans (Lite/Professional/Enterprise), monthly/annual billing, coupon codes, invoice history with VAT."),
        ]),
        ("Operations", "Maintenance and reporting", [
            ("Maintenance CMMS", "الصيانة", "Work order management with 6-stage workflow (Open to Closed), SLA tracking, technician assignment, and cost tracking."),
            ("Preventive Maintenance", "الصيانة الوقائية", "Frequency-based scheduling (daily to annual), auto work-order generation, 10 maintenance categories."),
            ("Reports", "التقارير", "Excel/PDF export for 10 report types: occupancy, financial, maintenance, leases, customers, development pipeline, approval status, pricing analysis."),
        ]),
        ("Platform & Administration", "System management and user support", [
            ("Dashboard", "نظرة عامة", "Real-time KPI cards with occupancy rates, land pipeline, project status distribution, maintenance cost trends, and revenue analytics."),
            ("Help Center", "المساعدة", "58 searchable FAQs across 8 categories, 25 step-by-step guides (bilingual), support ticket system, permission request workflow."),
            ("Settings", "الإعدادات", "Organization profile (MOC-aligned), team management with email invitations, security settings, and audit log viewer."),
            ("Platform Admin", "إدارة المنصة", "Admin hub for subscription plans, monitoring all subscriptions, creating coupons, viewing platform-wide invoices and revenue."),
            ("Onboarding", "التسجيل", "4-step post-registration wizard: org path choice (join/create), business identity, contact info, team invitations."),
        ]),
    ]

    for domain_name, domain_sub, modules in domains:
        new_page(c, "Platform Modules")
        y = draw_section_title(c, domain_name, None, 2)
        y -= 10
        for i, (name, ar_name, desc) in enumerate(modules):
            col = i % 2
            row = i // 2
            cx = MARGIN_L + col * (card_w + 16)
            cy = y - card_h - row * (card_h + 12)
            if cy < MARGIN_B + FOOTER_H + 10:
                break
            draw_module_card(c, name, ar_name, desc, cx, cy, card_w, card_h)

    # v1.2.0 Highlights page
    new_page(c, "Platform Modules")
    y = draw_section_title(c, "v1.2.0 Highlights", "Latest enhancements and new features", 2)
    y -= 6

    highlights = [
        "<b>Ejar-Compliant Lease Contracts</b> - Payment frequency, 5% security deposit cap, auto-renewal, maintenance responsibility, 60-day notice period",
        "<b>Wafi-Compliant Sale Contracts</b> - Delivery date, Wafi license reference, automatic escrow deposits on signing",
        "<b>Contract Lifecycle State Machine</b> - Draft, Sent, Signed with Cancel/Void transitions and automatic side-effects",
        "<b>Auto-Generated Contract Numbers</b> - Unique numbers per type (SALE-2026-XXXX / LEASE-2026-XXXX)",
        "<b>Progressive vs Destructive RBAC</b> - Separate permissions for create/send/sign vs cancel/void/delete",
        "<b>Unit-Contract Bridge</b> - Linked contract info and financial summary (P&amp;L) in unit detail panel",
        "<b>Help Center Expansion</b> - 58 FAQs (+14 new) and 25 guides (+4 new) covering all contract workflows",
    ]

    # Pre-measure bullet heights for proper box sizing
    bullet_style = ParagraphStyle("measure", fontName="DMSans", fontSize=9, textColor=SLATE, leading=13)
    total_content_h = 30  # title + padding
    for h in highlights:
        p = Paragraph(h, bullet_style)
        _, ph = p.wrap(USABLE_W - 30, 300)
        total_content_h += ph + 6

    # Green tinted background box — sized to content
    box_h = total_content_h + 16
    c.setFillColor(HexColor("#F0FFF4"))
    c.roundRect(MARGIN_L, y - box_h, USABLE_W, box_h, 8, fill=1, stroke=0)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1)
    c.roundRect(MARGIN_L, y - box_h, USABLE_W, box_h, 8, fill=0, stroke=1)

    # Title inside box
    hy = y - 18
    c.setFillColor(NAVY)
    c.setFont("DMSans", 14)
    c.drawString(MARGIN_L + 12, hy, "What's New in v1.2.0")
    hy -= 14

    # Bullets inside box
    for h in highlights:
        hy = draw_bullet(c, h, MARGIN_L + 8, hy, max_width=USABLE_W - 30, size=9)
        hy -= 2


def build_workflows(c):
    """Pages 12-14: Business Workflows."""
    workflows = [
        {
            "title": "Land to Launch",
            "arabic": "الأرض إلى الإطلاق",
            "steps": ["Land\nIdentified", "Due\nDiligence", "Acquired", "Planning\nOS", "Subdivision",
                       "Authority\nApproval", "Infra\nBuild", "Inventory", "Pricing", "Launch"],
        },
        {
            "title": "Sale to Escrow (Wafi)",
            "arabic": "البيع إلى الضمان",
            "steps": ["Lead\nGenerated", "Qualified", "Viewing", "Reserved", "Contract\nDraft",
                       "Contract\nSent", "Contract\nSigned", "Escrow\nDeposit", "Unit\nSold"],
        },
        {
            "title": "Lease to Collection (Ejar)",
            "arabic": "الإيجار إلى التحصيل",
            "steps": ["Tenant\nInquiry", "Viewing", "Lease\nCreated", "Contract\nSigned",
                       "Installments\nGenerated", "Monthly\nCollection", "Overdue\nTracking", "Renewal"],
        },
        {
            "title": "Off-Plan to Wave Sales",
            "arabic": "على الخارطة إلى الإطلاق",
            "steps": ["Project\nApproved", "Inventory\nStructured", "Pricing\nRules", "Wave\nCreated",
                       "Readiness\nCheck", "Wave\nLaunched", "Reservations", "Conversions"],
        },
        {
            "title": "Maintenance to Resolution",
            "arabic": "الصيانة إلى الحل",
            "steps": ["Request\nOpened", "SLA\nTimer", "Technician\nAssigned", "In\nProgress",
                       "Resolved", "Closed"],
            "note": "SLA: Urgent 2h | High 24h | Medium 72h | Low 168h",
        },
    ]

    # Workflows - 2 per page, then 1 on last page
    wf_per_page = [2, 2, 1]
    idx = 0
    for page_count in wf_per_page:
        new_page(c, "Business Workflows")
        if idx == 0:
            y = draw_section_title(c, "Business Workflows", "End-to-end process flows", 3)
        else:
            y = PAGE_H - MARGIN_T - HEADER_H - 5 * mm
            c.setFillColor(NAVY)
            c.setFont("DMSans", 16)
            c.drawString(MARGIN_L, y, "Business Workflows (continued)")
            y -= 20
        y -= 8

        for _ in range(page_count):
            if idx >= len(workflows):
                break
            wf = workflows[idx]
            # Workflow title — larger for hierarchy
            c.setFillColor(NAVY)
            c.setFont("DMSans", 15)
            c.drawString(MARGIN_L, y, wf["title"])
            c.setFont("IBMPlexArabic", 10)
            c.setFillColor(GOLD)
            ar_text = ar(wf["arabic"])
            c.drawString(MARGIN_L + c.stringWidth(wf["title"], "DMSans", 15) + 12, y, ar_text)
            y -= 20

            # Draw flow boxes
            steps = wf["steps"]
            n = len(steps)
            # Calculate box width to fit
            available = USABLE_W - (n - 1) * 12  # 12pt gaps for arrows
            box_w = min(available / n, 55)
            box_h = 28
            total_w = n * box_w + (n - 1) * 12
            start_x = MARGIN_L + (USABLE_W - total_w) / 2

            for i, step in enumerate(steps):
                bx = start_x + i * (box_w + 12)
                # Color-coded box: green start → navy middle → gold end
                if i == 0:
                    box_color = GREEN
                elif i == n - 1:
                    box_color = GOLD
                else:
                    # Gradient from navy to slightly lighter navy
                    box_color = NAVY if i % 2 == 0 else NAVY_LIGHT
                c.setFillColor(box_color)
                c.roundRect(bx, y - box_h, box_w, box_h, 5, fill=1, stroke=0)
                # Text (handle multi-line)
                lines = step.split("\n")
                c.setFillColor(WHITE)
                c.setFont("DMSans", 6.5)
                if len(lines) == 1:
                    c.drawCentredString(bx + box_w / 2, y - box_h / 2 - 2.5, lines[0])
                else:
                    c.drawCentredString(bx + box_w / 2, y - box_h / 2 + 2, lines[0])
                    c.drawCentredString(bx + box_w / 2, y - box_h / 2 - 7, lines[1])
                # Arrow
                if i < n - 1:
                    ax = bx + box_w + 1
                    ay = y - box_h / 2
                    c.setStrokeColor(GREEN)
                    c.setFillColor(GREEN)
                    c.setLineWidth(1.2)
                    c.line(ax, ay, ax + 9, ay)
                    c.line(ax + 6, ay + 3, ax + 9, ay)
                    c.line(ax + 6, ay - 3, ax + 9, ay)

            y -= box_h + 8
            # Note if present
            if "note" in wf:
                c.setFont("DMSans", 7.5)
                c.setFillColor(SLATE)
                c.drawCentredString(PAGE_W / 2, y, wf["note"])
                y -= 10

            y -= 25
            idx += 1


def build_user_stories(c):
    """Pages 15-18: User Stories & Use Cases."""
    card_w = USABLE_W
    card_h = 80

    tiers = [
        ("Management Tier", [
            ("System Admin", "مدير النظام", "Full platform + all org access",
             "As a System Admin, I can manage all subscription plans and monitor all organizations across the platform.",
             ["PII", "Export", "Finance", "Audit"]),
            ("System Support", "دعم النظام", "Platform operations and ticket management",
             "As System Support, I can manage support tickets, assign them to staff, and monitor resolution times.",
             ["PII", "Export", "Finance", "Audit"]),
            ("Company Admin", "مدير الشركة", "Full organization control, no platform access",
             "As a Company Admin, I can manage my team, approve contracts, control permissions, and view audit logs.",
             ["PII", "Export", "Finance", "Audit"]),
        ]),
        ("Sales & Leasing Tier", [
            ("Sales Manager", "مدير المبيعات", "CRM oversight, contracts, customer PII",
             "As a Sales Manager, I can view customer PII, create Ejar/Wafi contracts, manage reservations, and export sales reports.",
             ["PII", "Export", "Contracts Write"]),
            ("Sales Agent", "وكيل مبيعات", "Sales execution, no PII or export",
             "As a Sales Agent, I can manage leads, create reservations, and draft contracts, but I cannot access customer PII or export data.",
             ["Contracts Write", "No PII", "No Export"]),
            ("Property Manager", "مدير العقارات", "Rentals, maintenance, tenant management",
             "As a Property Manager, I can manage tenancies, create maintenance requests, and view lease contracts for my properties.",
             ["Contracts Read", "Leases"]),
        ]),
        ("Specialized Tier", [
            ("Project Manager", "مدير المشاريع", "Projects, units, site logs",
             "As a Project Manager, I can manage projects through all 14 lifecycle stages, create buildings and units, and track site logs.",
             ["Contracts Read", "Planning"]),
            ("Finance Officer", "مسؤول مالي", "Payments, reporting, financial data",
             "As a Finance Officer, I can track payments, manage installments, calculate VAT, generate financial reports, and monitor escrow accounts.",
             ["Finance", "Escrow"]),
            ("Technician", "فني صيانة", "Maintenance work orders only",
             "As a Technician, I can view assigned work orders, update status, log labor hours, and record maintenance costs.",
             ["Maintenance"]),
            ("Eng. Consultant", "مستشار هندسي", "Wafi milestone certification",
             "As an Engineering Consultant, I can certify project milestones and upload evidence for Wafi compliance.",
             ["Wafi"]),
        ]),
        ("End User Tier", [
            ("Buyer", "مشتري", "Purchase tracking, documents",
             "As a Buyer, I can view my purchased units, track contract status, and submit maintenance requests.",
             ["Contracts Read"]),
            ("Tenant", "مستأجر", "Lease viewing, maintenance requests",
             "As a Tenant, I can view my lease contract details, payment schedule, and submit maintenance requests.",
             ["Contracts Read", "Ejar"]),
            ("User", "مستخدم", "Basic access, profile management",
             "As a User, I can view the dashboard, access the help center, and manage my profile.",
             ["Dashboard"]),
        ]),
    ]

    for tier_name, roles in tiers:
        new_page(c, "User Stories & Use Cases")
        if tier_name == "Management Tier":
            y = draw_section_title(c, "User Stories & Use Cases", "13 roles organized by business tier", 4)
        else:
            y = PAGE_H - MARGIN_T - HEADER_H - 5 * mm
        y -= 8

        # Tier name — larger with accent bar
        c.setFillColor(GREEN)
        c.roundRect(MARGIN_L, y - 2, 4, 18, 2, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("DMSans", 16)
        c.drawString(MARGIN_L + 12, y, tier_name)
        y -= 24

        for role in roles:
            if y - card_h < MARGIN_B + FOOTER_H:
                break
            draw_role_card(c, role[0], role[1], role[2], role[3], role[4],
                           MARGIN_L, y - card_h, card_w, card_h)
            y -= card_h + 10


def build_usps(c):
    """Pages 19-20: Unique Selling Propositions."""
    usps = [
        ("Saudi-First Compliance", [
            "RERA licensing, ZATCA VAT, Ejar rental, Balady permits, Wafi escrow",
            "Integrated into workflows, not afterthoughts",
            "No local consultant needed for regulatory setup",
        ]),
        ("Full Lifecycle Coverage", [
            "Land acquisition through post-handover in one platform",
            "Eliminates the need for 5-7 separate software tools",
            "Seamless data flow across all property stages",
        ]),
        ("Arabic-First Bilingual", [
            "RTL-first UI with IBM Plex Arabic typography",
            "Hijri/Gregorian dual dates, SAR currency formatting",
            "Not a translated English product",
        ]),
        ("Data Protection by Design", [
            "AES-256-GCM PII encryption, 30+ granular permissions",
            "PDPL/NCA compliance built into architecture",
            "Full audit trails per PDPL Article 32",
        ]),
        ("Vision 2030 Aligned", [
            "E-government integration (Ejar, Balady, ZATCA, Wafi)",
            "Paperless workflows and data-driven decisions",
            "Supports Saudi digital transformation agenda",
        ]),
        ("SaaS Multi-Tenant", [
            "13 user roles with 30+ granular permissions",
            "Organization-scoped data isolation, CR-based discovery",
            "3-tier subscription plans, ready for scale",
        ]),
    ]

    card_w = USABLE_W / 2 - 6
    card_h = 115

    new_page(c, "Unique Selling Propositions")
    y = draw_section_title(c, "Unique Selling Propositions", "What sets Mimaric apart", 5)
    y -= 14

    for i, (title, bullets) in enumerate(usps[:4]):
        col = i % 2
        row = i // 2
        cx = MARGIN_L + col * (card_w + 12)
        cy = y - row * (card_h + 10) - card_h
        draw_usp_card(c, i + 1, title, bullets, cx, cy, card_w, card_h)

    new_page(c, "Unique Selling Propositions")
    y2 = PAGE_H - MARGIN_T - HEADER_H - 10 * mm

    for i, (title, bullets) in enumerate(usps[4:6]):
        col = i % 2
        cx = MARGIN_L + col * (card_w + 12)
        cy = y2 - card_h
        draw_usp_card(c, i + 5, title, bullets, cx, cy, card_w, card_h)


def build_screenshots(c):
    """Pages 21-26: Screenshots."""
    screenshots = [
        ("dashboard.png", "Dashboard Overview",
         "Real-time KPI dashboard showing occupancy rates, revenue analytics, project status distribution, maintenance cost trends, and land pipeline visualization.",
         ["12+ KPI cards with real-time data", "Interactive charts and visualizations", "Date range filtering", "Role-based data visibility"]),
        ("projects.png", "Project Management",
         "Project portfolio view with card-grid layout showing project types, progress status, and key metrics for each development.",
         ["14-stage lifecycle stepper", "P&L financials tab", "Building/unit management", "Document vault with versioning"]),
        ("sales.png", "Sales & Contracts",
         "Sales engine hub with customer CRM pipeline, reservation management, and Ejar/Wafi compliant contract lifecycle tracking.",
         ["Kanban + List views", "Contract state machine (Draft/Sent/Signed)", "4-step reservation wizard", "PII encryption for customer data"]),
        ("rentals.png", "Rental Management",
         "Rental management dashboard with Ejar-compliant lease creation, installment schedule tracking, and rent collection monitoring.",
         ["Auto installment generation by frequency", "Payment frequency options (monthly to annual)", "Overdue tracking and alerts", "Tenant management"]),
        ("finance.png", "Financial Overview",
         "Financial overview with revenue KPIs, payment tracking, ZATCA-compliant VAT calculation, and installment schedule management.",
         ["VAT 15% calculation (ZATCA)", "Payment status tracking", "Invoice generation", "Excel/PDF export"]),
        ("maintenance.png", "Maintenance CMMS",
         "CMMS work order management with SLA-based priority tracking, technician assignment, and preventive maintenance scheduling.",
         ["6-stage work order workflow", "SLA timers (2h to 168h)", "Preventive scheduling", "Cost and labor tracking"]),
    ]

    for fname, title, body, caps in screenshots:
        new_page(c, "Platform Screenshots")
        img_path = os.path.join(SCREENSHOTS_DIR, fname)
        draw_screenshot_page(c, img_path, title, body, caps)


def build_user_guide(c):
    """Pages 27-29: Basic User Guideline."""
    # Page 27 - Getting Started
    new_page(c, "Basic User Guideline")
    y = draw_section_title(c, "Basic User Guideline", "Getting started with Mimaric", 7)
    y -= 14

    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "Getting Started")
    y -= 24

    steps = [
        ("Step 1: Register", "Choose Individual or Company account. Enter your name, email, and password (minimum 10 characters, NIST SP 800-63B compliant). Individual users can search for existing organizations by Commercial Registration number."),
        ("Step 2: Onboard", "Complete the 4-step setup wizard: (1) Choose org path - join an existing company or continue independently, (2) Enter business identity - company name, CR number, VAT number, entity type, (3) Add contact details - mobile, city, region, (4) Invite team members with role assignment."),
        ("Step 3: Navigate", "Access the main dashboard. Your sidebar navigation shows only the modules matching your role permissions. Company Admins see all modules; Technicians see only Dashboard and Maintenance. Language toggle (AR/EN) and theme toggle (light/dark) are in the top bar."),
    ]
    for i, (title, desc) in enumerate(steps):
        # Step number badge
        c.setFillColor(GREEN)
        c.circle(MARGIN_L + 14, y + 4, 12, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("DMSans", 11)
        c.drawCentredString(MARGIN_L + 14, y, str(i + 1))
        # Title
        c.setFillColor(NAVY)
        c.setFont("DMSans", 12)
        c.drawString(MARGIN_L + 32, y, title)
        y -= 8
        y = draw_text_block(c, desc, MARGIN_L + 32, y, max_width=USABLE_W - 32,
                             size=9, leading=12.5)
        y -= 14

    # Page 28 - Quick Reference
    new_page(c, "Basic User Guideline")
    y = PAGE_H - MARGIN_T - HEADER_H - 5 * mm
    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "Key Workflows Quick Reference")
    y -= 16

    # Table - use Paragraph for text wrapping
    hdr_style = ParagraphStyle("tbl_hdr", fontName="DMSans", fontSize=9, textColor=WHITE, leading=12)
    cell_style = ParagraphStyle("tbl_cell", fontName="DMSans", fontSize=8.5, textColor=SLATE, leading=11)
    data = [
        [Paragraph("Task", hdr_style), Paragraph("Where to Go", hdr_style), Paragraph("Key Steps", hdr_style)],
        [Paragraph("Add a property", cell_style), Paragraph("Projects &gt; New Project", cell_style), Paragraph("Enter name, type, location &gt; Add buildings &gt; Add units", cell_style)],
        [Paragraph("Create a lease", cell_style), Paragraph("Sales &gt; Contracts &gt; New (Lease)", cell_style), Paragraph("Select tenant + unit &gt; Set Ejar terms &gt; Save &gt; Send &gt; Sign", cell_style)],
        [Paragraph("Record a sale", cell_style), Paragraph("Sales &gt; Contracts &gt; New (Sale)", cell_style), Paragraph("Select buyer + unit &gt; Set Wafi terms &gt; Save &gt; Send &gt; Sign", cell_style)],
        [Paragraph("File maintenance", cell_style), Paragraph("Maintenance &gt; New Request", cell_style), Paragraph("Select unit &gt; Choose category + priority &gt; Describe &gt; Submit", cell_style)],
        [Paragraph("Generate report", cell_style), Paragraph("Reports &gt; Select type", cell_style), Paragraph("Choose report type &gt; Set date range &gt; Click Excel or PDF", cell_style)],
    ]

    col_widths = [USABLE_W * 0.18, USABLE_W * 0.30, USABLE_W * 0.52]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, 1), (-1, -1), ALABASTER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ALABASTER, WHITE]),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    tw, th = t.wrap(USABLE_W, 400)
    t.drawOn(c, MARGIN_L, y - th)
    y -= th + 30

    # Role Navigation
    c.setFillColor(NAVY)
    c.setFont("DMSans", 16)
    c.drawString(MARGIN_L, y, "Role-Based Navigation Guide")
    y -= 16
    c.setFont("DMSans", 9)
    c.setFillColor(SLATE)
    c.drawString(MARGIN_L, y, "What you see in the sidebar depends on your assigned role.")
    y -= 16

    nav_cell = ParagraphStyle("nav_cell", fontName="DMSans", fontSize=8.5, textColor=SLATE, leading=11)
    nav_data = [
        [Paragraph("Role", hdr_style), Paragraph("Sidebar Modules", hdr_style), Paragraph("Primary Actions", hdr_style)],
        [Paragraph("Company Admin", nav_cell), Paragraph("All modules", nav_cell), Paragraph("Team management, approvals, audit review", nav_cell)],
        [Paragraph("Sales Manager", nav_cell), Paragraph("Dashboard, Customers, Sales, Reports", nav_cell), Paragraph("Lead management, contract creation, reporting", nav_cell)],
        [Paragraph("Property Manager", nav_cell), Paragraph("Dashboard, Units, Rentals, Maintenance", nav_cell), Paragraph("Lease management, work orders, tenant support", nav_cell)],
        [Paragraph("Finance Officer", nav_cell), Paragraph("Dashboard, Finance, Reports, Billing", nav_cell), Paragraph("Payment tracking, VAT, financial reports", nav_cell)],
        [Paragraph("Technician", nav_cell), Paragraph("Dashboard, Maintenance", nav_cell), Paragraph("Work order updates, cost logging", nav_cell)],
    ]

    nav_col_widths = [USABLE_W * 0.22, USABLE_W * 0.38, USABLE_W * 0.40]
    t2 = Table(nav_data, colWidths=nav_col_widths)
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "DMSans"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "DMSans"),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), SLATE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ALABASTER, WHITE]),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
    ]))
    tw2, th2 = t2.wrap(USABLE_W, 400)
    t2.drawOn(c, MARGIN_L, y - th2)


def build_closing(c):
    """Page 30: Closing page."""
    new_page(c, "")
    # Clean white page
    y = PAGE_H / 2 + 80
    # Logo centered
    try:
        logo_w = 100 * mm
        logo_h = logo_w * 0.487
        c.drawImage(LOGO_PATH, (PAGE_W - logo_w) / 2, y, width=logo_w, height=logo_h,
                     preserveAspectRatio=True, mask="auto")
        y -= 20
    except Exception:
        pass

    # Thank you
    c.setFillColor(NAVY)
    c.setFont("DMSans", 28)
    c.drawCentredString(PAGE_W / 2, y, "Thank You")
    y -= 25
    # Arabic thank you
    c.setFont("IBMPlexArabic", 22)
    c.setFillColor(GOLD)
    c.drawCentredString(PAGE_W / 2, y, ar("شكراً لكم"))
    y -= 40

    # Green accent line
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.line(PAGE_W / 2 - 50, y, PAGE_W / 2 + 50, y)
    y -= 30

    # Company info
    c.setFillColor(SLATE)
    c.setFont("DMSans", 11)
    info = ["Mimaric PropTech", "Saudi Arabia"]
    for line in info:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 18
    y -= 10

    # Tagline
    c.setFillColor(NAVY)
    c.setFont("DMSans", 12)
    c.drawCentredString(PAGE_W / 2, y, "Built for the Saudi Property Market")
    y -= 30

    # Compliance footer
    c.setFillColor(SLATE)
    c.setFont("DMSans", 8)
    c.drawCentredString(PAGE_W / 2, y,
                         "Compliant with RERA, ZATCA, Ejar, Balady, PDPL, and NCA standards")

    # Gold dots
    y -= 20
    c.setFillColor(GOLD)
    for dx in [-30, -15, 0, 15, 30]:
        c.circle(PAGE_W / 2 + dx, y, 2, fill=1, stroke=0)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    register_fonts()

    c = canvas.Canvas(OUTPUT_FILE, pagesize=A4)
    c.setTitle("Mimaric Business Documentation v1.2.0")
    c.setAuthor("Mimaric PropTech")
    c.setSubject("Business Documentation for Mimaric Saudi PropTech Platform")

    print("Building cover page...")
    build_cover(c)

    print("Building document info...")
    build_doc_info(c)

    print("Building table of contents...")
    build_toc(c)

    print("Building executive summary...")
    build_executive_summary(c)

    print("Building platform modules...")
    build_modules(c)

    print("Building business workflows...")
    build_workflows(c)

    print("Building user stories...")
    build_user_stories(c)

    print("Building USPs...")
    build_usps(c)

    print("Building screenshots...")
    build_screenshots(c)

    print("Building user guideline...")
    build_user_guide(c)

    print("Building closing page...")
    build_closing(c)

    c.save()
    print(f"\nPDF generated successfully: {OUTPUT_FILE}")
    print(f"Total pages: {page_num[0]}")


if __name__ == "__main__":
    main()
