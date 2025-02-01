// app/api/downloadPDF/route.js
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    const { html } = await request.json();
    
    // Extract menu content and instructions, preserving the original structure
    const menuMatch = html.match(/<div class="menu-container">([\s\S]*?)<\/div>/);
    const menuContent = menuMatch ? menuMatch[0] : '';
    const instructions = html.match(/Category Breakdown[\s\S]*?(?=<div class="menu-container">)/)?.[0] || '';
    
    // Create HTML with proper page breaks
    const formattedHTML = `
      <html>
        <head>
          <style>
            @page {
              size: Letter;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .instructions-page {
              page-break-after: always;
              padding: 1in;
              font-family: Arial, sans-serif;
              min-height: 11in;
            }
            .menu-container {
              width: 100%;
              max-width: 8.5in;
              margin: 0 auto;
            }
            .menu-page {
              width: 8.5in;
              min-height: 11in;
              padding: 1in;
              page-break-after: always;
              box-sizing: border-box;
              position: relative;
            }
            .menu-page:last-child {
              page-break-after: avoid;
            }
            .section-title {
              page-break-after: avoid;
            }
            .menu-item {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="instructions-page">
            <h2>Menu Design Instructions</h2>
            ${instructions}
          </div>
          ${menuContent}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: 'new'
    });
    const page = await browser.newPage();
    
    // Set viewport to match page size
    await page.setViewport({
      width: 816, // 8.5 inches * 96 DPI
      height: 1056 // 11 inches * 96 DPI
    });
    
    await page.setContent(formattedHTML, { 
      waitUntil: ['networkidle0', 'load', 'domcontentloaded']
    });
    
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=menu.pdf'
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}