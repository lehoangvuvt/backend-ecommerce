import * as html_to_pdf from 'html-pdf-node';
import moment from 'moment';

export const html_pdf = async (bill_info) => {
  let options = { format: 'A4' };
  let buffer = '';
  let file = {
    content: `<style> html { -webkit-print-color-adjust: exact; } </style> <div style=" background-color: #f5f5f5 !important; margin: 0; padding: 0; width: 100%; height: 100%; " > <section id="header" style=" display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; -webkit-align-items: center; " > <div id="header-left" style=" display: -webkit-box; display: -webkit-flex; -webkit-flex-direction: column; -webkit-align-items: flex-start; margin: 20px; " > <h2 style="padding: 0; margin: 0">${
      bill_info.company
    }</h2> <h2 style="padding: 0; margin: 0">${
      bill_info.address
    }</h2> <h2 style="padding: 0; margin: 0">${
      bill_info.phone
    }</h2> </div> <div id="header-right" style="margin: 20px"> <div id="logo" style="background-color: black !important; width: 150px; height: 100px" ></div> </div> </section> <section id="invoice" style=" display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; -webkit-align-items: center; -webkit-flex-direction: column; " > <table id="invoice-upper" width="100%" height="100%" style="table-layout: fixed" > <tr style="background-color: #577188 !important"> <th align="left"> <span style="margin-left: 10px; color: white">INVOICE NO.</span> </th> <th align="right"> <span style="margin-right: 10px; color: white">DATE</span> </th> </tr> <tr> <td align="left"> <span style="margin-left: 10px">${
      bill_info.invoice_no
    }</span> </td> <td align="right"> <span style="margin-right: 10px">${
      bill_info.date
    }</span> </td> </tr> </table> <table id="invoice-lower" width="100%" height="100%"> <thead> <tr> <th align="left" style="width: 25%; border-bottom: 1px solid #577188"> <span style="margin-left: 10px; color: #577188">BILL TO</span> </th> <th align="left" style="width: 25%; border-bottom: 1px solid #577188"> <span style="margin-right: 10px; color: #577188">SHIP TO</span> </th> <th align="left" style="width: 50%; border-bottom: 1px solid #577188"> <span style="margin-right: 10px; color: #577188">INSTRUCTIONS</span> </th> </tr> </thead> <tbody> <tr> <td align="left"> <span style="margin-left: 10px">${
      bill_info.customer_name
    }</span> </td> <td align="left"> <span style="margin-right: 10px">${
      bill_info.ship_to
    }</span> </td> <td align="left"> <span style="margin-right: 10px" >${
      bill_info.instructions
    }</span > </td> </tr> <tr> <td align="left"> <span style="margin-left: 10px">${
      bill_info.customer_address
    }</span> </td> </tr> <tr> <td align="left"> <span style="margin-left: 10px">${
      bill_info.customer_city
    }</span> </td> </tr> </tbody> </table> </section> <section id="order" style=" display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; -webkit-align-items: center; -webkit-flex-direction: column; margin-top: 20px; " > <table id="order-items" width="100%" height="100%"> <thead> <tr style="background-color: #577188 !important"> <th align="left" style="width: 10%"> <span style="margin-left: 10px; color: white">QUANTITY</span> </th> <th align="left" style="width: 50%"> <span style="margin-left: 10px; color: white">DESCRIPTION</span> </th> <th align="right" style="width: 20%"> <span style="margin-right: 10px; color: white">UNIT PRICE</span> </th> <th align="right" style="width: 20%"> <span style="margin-right: 10px; color: white">TOTAL</span> </th> </tr> </thead> <tbody> ${bill_info.order_items.map(
      (item) => {
        return `<tr> <td align="left" style="border-bottom: 1px solid #e9e3e3"> <span style="margin-left: 10px">${
          item.quantity
        }</span> </td> <td align="left" style="border-bottom: 1px solid #e9e3e3"> <span style="margin-left: 10px">${
          item.description
        }</span> </td> <td align="right" style="border-bottom: 1px solid #e9e3e3"> <span style="margin-right: 10px">${
          item.price
        }</span> </td> <td align="right" style="border-bottom: 1px solid #e9e3e3"> <span style="margin-right: 10px">${
          item.total
        }</span> </td> </tr> `;
      },
    )} </tbody> </table> </section> <section style=" display: -webkit-box; display: -webkit-flex; -webkit-flex-direction: column; -webkit-align-items: flex-end; " > <div id="sub-total" style=" display: -webkit-box; display: -webkit-flex; -webkit-flex-direction: column; -webkit-align-items: flex-start; width: 40%; " > <div align="left" style=" border-bottom: 1px solid #e9e3e3; width: 100%; display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; " > <span style="color: #577188">SUBTOTAL</span> <span style="margin-right: 15px; color: #577188">${bill_info.sub_total}</span> </div> <div align="left" style=" border-bottom: 1px solid #e9e3e3; width: 100%; display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; " > <span style="color: #577188">SALES TAX</span> <span style="margin-right: 15px; color: #577188">${bill_info.sales_tax}</span> </div> <div align="left" style=" border-bottom: 1px solid #8f8f8f; width: 100%; display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; " > <span style="color: #577188">SHIPPING & HANDLING</span> <span style="margin-right: 15px; color: #577188">${bill_info.shipping_amt}</span> </div> <div align="left" style=" border-bottom: 1px solid #8f8f8f; width: 100%; display: -webkit-box; display: -webkit-flex; -webkit-justify-content: space-between; " > <span style="color: #577188">TOTAL DUE BY DATE</span> <span style="margin-right: 15px; color: #577188">${bill_info.total_amt}</span> </div> <div style="margin: 30px 0 0 0"> <span>Thank you for your business!</span> </div> </div> </section> </div>`,
  };
  await html_to_pdf.generatePdf(file, options).then((pdfBuffer) => {
    buffer = pdfBuffer;
  });
  return buffer;
};

export const delivery_pdf = async (bill_info) => {
  let options = { format: 'A4' };
  let buffer = '';
  let file ={
    content: `<style type="text/css">
    body { font-family: Arial; font-size: 16.0px }
    span, td {
      font-size: 11.6px;
    }
    .header-company div {
      margin: 8px;
    }
    table,tr,td {
      border: 1px solid black;
    }
    
    td {
      padding: 5px;
    }
    
    td#first {
      font-weight: 600;
    }
    
    div#billing-shipping div div {
      margin: 8px;
    }
    
    table#item-table {
      width: 100%;
    }
    
    table#item-table tr th {
      border: 1px solid black;
    }
    
    th#item-code, td#item-code, th#quantity, td#quantity {
      width: 20%;
    }
    
    th#description,td#description {
      width: 60%;
    }
    </style>
    <div class="pos" id="_0:0" style=" margin: 20px; width: 90%; height: 90%; ">
      <div style="display: inline-flex; justify-content: space-between; width: 100%;">
        <div id="Company" class="header-company"> 
          <div>
            <span style="font-weight: 600; font-size: 12.6px;">
              ${bill_info.company}
            </span>
          </div>
          <div>
            <span>
              145 Nguyen Co Thach
            </span>
          </div>
          <div>
            <span>
              An Loi Dong, District 2, HCMC
            </span>
          </div>
          <div>
            <span>
              ${bill_info.phone}
            </span>
          </div>
          <div>
            <span>
              Email: infor@lbcint.com 
            </span>
          </div>
          <div>
            <span>
              Website: www.lbcint.com
            </span>
          </div>
        </div>
        <div id="DeliveryNote">
          <div style="text-align:right">
            <span style="font-size:14px; font-weight: 700">
              Delivery Note
            </span>
          </div>
          <table style="border-collapse: collapse;">
            <tr>
            <td id="first">Code</td>
            <td>DN12.09.0001</td>
            </tr>
            <tr>
            <td id="first">Date</td>
            <td>${bill_info.date}</td>
            </tr>
            <tr>
            <td id="first">Shipping Date</td>
            <td>${moment(new Date()).format("DD-MM-YYYY")}</td>
            </tr>
            <tr>
            <td id="first">Order No.</td>
            <td>${bill_info.invoice_no}</td>
            </tr>
          </table>
        </div>
      </div>
      <br />
      <br />
      <br />
      <div id="billing-shipping" style="display: grid; grid-template-columns: auto auto; width: 100%; margin: 10px;">
        <div style="width: 100%;">
          <div>
            <span>
              Bill To:
            </span>
            <span>
              ${bill_info.customer_name}
            </span> 
          </div>
          <div>
            <span>${bill_info.customer_address}</span>
          </div>
          <div>
            <span>${bill_info.customer_city}</span>
          </div>
          <div>
            <span>
              Phone: 
            </span>
            <span>
              970-923-5552
            </span> 
          </div>
        </div>
        <div style="width: 100%;">
          <div>
            <span>
              Ship To:
            </span>
            <span>
              Mack 
            </span> 
          </div>
          <div>
            <span>14 Main St</span>
          </div>
          <div>
            <span>Woody Creek CO</span>
          </div>
          <div>
            <span>
              Phone: 
            </span>
            <span>
              970-923-5552
            </span> 
          </div>
        </div>
      </div>
      <div>
        <table id="item-table" style="border-collapse: collapse;">
          <tr>
            <th id="item-code">Item Code</th>
            <th id="description">Description</th>
            <th id="quantity">Quantity</th>
          </tr>
            ${
              bill_info.order_items.map(item => {
                return `<tr>
                <td  id="item-code">Code</td>
                <td id="description">${item.description}</td>
                <td id="quantity">${item.quantity}</td>
                </tr>`
              })
            }
        </table>
      </div>
      <br />
      <br />
      <div>
        <span>
          Thank you for your purchase!
        </span>
      </div>
    </div>`
  }
  await html_to_pdf.generatePdf(file, options).then((pdfBuffer) => {
    buffer = pdfBuffer;
  });
  return buffer;
}