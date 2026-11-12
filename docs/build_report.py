# -*- coding: utf-8 -*-
"""
UniMind Graduation Report Builder
Generates a 50+ page complete academic report in Word (.docx) format
conforming to the Lac Hong University template.
"""

import os
import docx
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

from report_data import (
    REPORT_TITLE, FACULTY, UNIVERSITY, REPORT_TYPE, INSTRUCTOR, CLASS_NAME, LOCATION_DATE,
    STUDENTS, ABBREVIATIONS, PREFACE_TEXT, TABLE_OF_CONTENTS_LIST, TABLE_LIST, FIGURE_LIST
)
from report_chapters import (
    CH1_CONTENT, CH2_CONTENT, CH3_CONTENT, CH4_CONTENT, CH5_CONTENT, CH6_CONTENT, REFERENCES_LIST
)
from report_tables import (
    TABLE_1_1, TABLE_2_1, USE_CASE_TABLES, DATA_DICTIONARY_TABLES,
    TABLE_5_1, TABLE_5_2, TABLE_5_3, TABLE_5_4, TABLE_5_5, TABLE_5_6
)

TEMPLATE_PATH = 'b:/PTUD/PTUD/docs/Template_BaoCaoHocPhanPhatTrienUngDung.docx'
OUTPUT_PATH = 'b:/PTUD/PTUD/docs/BaoCaoTotNghiep_UniMind.docx'
IMG_DIR = 'b:/PTUD/PTUD/docs/images'

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_heading_1(doc, text):
    p = doc.add_paragraph(text, style='Heading 1')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(12)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(18)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph(text, style='Heading 2')
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(2, 132, 199)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph(text, style='Heading 3')
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(30, 41, 59)
    return p

def add_heading_4(doc, text):
    p = doc.add_paragraph(text, style='Heading 4')
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_body_paragraph(doc, text):
    p = doc.add_paragraph(style='Normal')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.25
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(15, 23, 42)
    return p

def add_caption(doc, text, is_table=True):
    p = doc.add_paragraph(style='Normal')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.italic = True
    r.font.color.rgb = RGBColor(3, 105, 161) if is_table else RGBColor(51, 65, 85)
    return p

def add_custom_table(doc, table_def, col_widths=None):
    add_caption(doc, table_def["caption"], is_table=True)
    headers = table_def["headers"]
    rows = table_def["rows"]
    
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)
    
    # Format header row
    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].text = header_text
        set_cell_background(hdr_cells[i], "0284C7")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            
    # Format data rows
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = cell_value
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            # Center short text, justify long text
            if len(cell_value) < 20 and not '\n' in cell_value:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(11)
                r.font.color.rgb = RGBColor(15, 23, 42)
                
    # Set explicit widths if provided
    if col_widths and len(col_widths) == len(headers):
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width
                
    doc.add_paragraph(style='Normal').paragraph_format.space_after = Pt(6)

def add_image_figure(doc, img_filename, caption_text, width_inches=6.0):
    img_path = os.path.join(IMG_DIR, img_filename)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(width_inches))
        add_caption(doc, caption_text, is_table=False)
    else:
        print(f"Warning: Image file not found: {img_path}")

def parse_and_add_content(doc, content_str):
    for line in content_str.strip().split('\n'):
        text = line.strip()
        if not text:
            continue
        if text.startswith('1.1 ') or text.startswith('1.2 ') or text.startswith('1.3 ') or text.startswith('1.4 ') or \
           text.startswith('2.1 ') or text.startswith('2.2 ') or text.startswith('2.3 ') or text.startswith('2.4 ') or \
           text.startswith('3.1 ') or text.startswith('3.2 ') or text.startswith('3.3 ') or text.startswith('3.4 ') or text.startswith('3.5 ') or \
           text.startswith('4.1 ') or text.startswith('4.2 ') or text.startswith('4.3 ') or text.startswith('4.4 ') or \
           text.startswith('5.1 ') or text.startswith('5.2 ') or text.startswith('5.3 ') or \
           text.startswith('6.1 ') or text.startswith('6.2 ') or text.startswith('6.3 '):
            add_heading_2(doc, text)
        elif text.startswith('1.3.1') or text.startswith('1.3.2') or text.startswith('1.3.3') or \
             text.startswith('2.1.1') or text.startswith('2.1.2') or text.startswith('2.1.3') or \
             text.startswith('2.2.1') or text.startswith('2.2.2') or text.startswith('2.2.3') or \
             text.startswith('2.3.1') or text.startswith('2.3.2') or text.startswith('2.3.3') or \
             text.startswith('2.4.1') or text.startswith('2.4.2') or text.startswith('2.4.3') or \
             text.startswith('3.2.1') or text.startswith('3.2.2') or text.startswith('3.2.3') or \
             text.startswith('3.3.1') or text.startswith('3.4.1') or text.startswith('3.4.2') or text.startswith('3.4.3') or \
             text.startswith('3.5.1') or text.startswith('3.5.2') or text.startswith('3.5.3') or \
             text.startswith('4.2.1') or text.startswith('4.2.2') or text.startswith('4.2.3') or text.startswith('4.2.4') or text.startswith('4.2.5') or \
             text.startswith('4.3.1') or text.startswith('4.3.2') or text.startswith('4.3.3') or \
             text.startswith('5.1.1') or text.startswith('5.1.2') or text.startswith('5.1.3') or text.startswith('5.1.4') or \
             text.startswith('5.2.1') or text.startswith('5.2.2') or \
             text.startswith('5.3.1') or text.startswith('5.3.2'):
            add_heading_3(doc, text)
        elif text.startswith('1. ') or text.startswith('2. ') or text.startswith('3. ') or text.startswith('4. ') or text.startswith('- ') or text.startswith('+ '):
            p = doc.add_paragraph(style='Normal')
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.2
            r = p.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(13)
        else:
            add_body_paragraph(doc, text)

print("Setup builder functions completed.")
