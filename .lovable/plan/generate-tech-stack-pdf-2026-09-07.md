# Generate Tech Stack PDF

## Goal
Create a downloadable PDF document that lists every piece of software, language, framework and service used to run the eQ Info Hub self-hosted application on the local Rocky Linux VM.

## What will be produced
- A single PDF saved to `/mnt/documents/eQ_Info_Hub_Tech_Stack.pdf`.
- The document will mirror the tech-stack answer already provided in chat, formatted into sections with tables and a request-flow summary.

## Steps
1. Write a Python/ReportLab script to generate the PDF.
2. Run the script to produce the file.
3. Convert each page to an image and visually inspect for layout issues.
4. Present the file as a chat artifact for download.

## Notes
- No project source files will be modified.
- The PDF uses DejaVu Sans for Unicode support and the project's blue/dark brand colours.
