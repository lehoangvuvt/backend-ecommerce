import * as ExcelJS from 'exceljs';
import ExportTemplateDTO from '../modules/admin/dto/export_template.dto';

export const generateExcel = async (data: Array<Object>) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('My Sheet');
    let headers: Array<{ header: string, key: string }> = [];
    data.forEach(o => {
        Object.keys(o).forEach(k => {
            if (headers.filter(header => header.key === k).length > 0) return;
            headers = [...headers, { header: k.toUpperCase(), key: k }];
        })
    })
    sheet.columns = headers;
    data.forEach(o => {
        sheet.addRow(o);
    })
    sheet.columns.forEach(function (column, i) {
        var maxLength = 0;
        column["eachCell"]({ includeEmpty: true }, function (cell) {
            var columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength + 2;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

export const generateExcelForImportProducts = async (exportTemplateDTO: ExportTemplateDTO) => {
    const { brands, categories, products } = exportTemplateDTO;
    const workbook = new ExcelJS.Workbook();

    const categorySheet = workbook.addWorksheet('Categories');
    let categoryHeaders: Array<{ header: string, key: string }> = [];
    categories.forEach(o => {
        Object.keys(o).forEach(k => {
            if (categoryHeaders.filter(header => header.key === k).length > 0) return;
            categoryHeaders = [...categoryHeaders, { header: k.toUpperCase(), key: k }];
        })
    })
    categorySheet.columns = categoryHeaders;
    categories.forEach(o => {
        categorySheet.addRow(o);
    })
    categorySheet.columns.forEach(function (column, i) {
        var maxLength = 0;
        column["eachCell"]({ includeEmpty: true }, function (cell) {
            var columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength + 2;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
    });


    const brandSheet = workbook.addWorksheet('Brands');
    let brandHeaders: Array<{ header: string, key: string }> = [];
    brands.forEach(o => {
        Object.keys(o).forEach(k => {
            if (brandHeaders.filter(header => header.key === k).length > 0) return;
            brandHeaders = [...brandHeaders, { header: k.toUpperCase(), key: k }];
        })
    })
    brandSheet.columns = brandHeaders;
    brands.forEach(o => {
        brandSheet.addRow(o);
    })
    brandSheet.columns.forEach(function (column, i) {
        var maxLength = 0;
        column["eachCell"]({ includeEmpty: true }, function (cell) {
            var columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength + 2;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
    });

    const productSheet = workbook.addWorksheet('Products');
    let productHeaders: Array<{ header: string, key: string }> = [];
    products.forEach(o => {
        Object.keys(o).forEach(k => {
            if (productHeaders.filter(header => header.key === k).length > 0) return;
            productHeaders = [...productHeaders, { header: k.toUpperCase(), key: k }];
        })
    })
    productSheet.columns = productHeaders;
    products.forEach(o => {
        productSheet.addRow(o);
    })
    productSheet.columns.forEach(function (column, i) {
        var maxLength = 0;
        column["eachCell"]({ includeEmpty: true }, function (cell) {
            var columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength + 2;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}