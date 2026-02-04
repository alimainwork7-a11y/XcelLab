
declare const XLSX: any;

export const exportMultiSheetExcel = (sheets: { name: string, data: any[] }[], filename: string) => {
  try {
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      const ws = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    
    const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, fullFilename);
  } catch (error) {
    console.error("Export error:", error);
    alert("Failed to export Excel file.");
  }
};
