import { useEffect, useState, useRef } from 'react';
import { X, Download, Printer, MessageSquareText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToWords } from 'to-words';

interface InvoicePDFProps {
  invoice: any;
  onClose: () => void;
}

export function InvoicePDF({ invoice, onClose }: InvoicePDFProps) {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState(invoice.client?.phone || '');

  const toWords = new ToWords({
    localeCode: 'fr-FR',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
    }
  });

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching company information:', error);
      } else {
        setCompanyInfo(data);
      }
    };

    fetchCompanyInfo();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-BE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const generatePDF = () => {
    if (!invoiceRef.current) return;

    html2canvas(invoiceRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
// Removed unused pdfHeight variable
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`facture-${invoice.id}.pdf`);
    });
  };

  const handleSendWhatsApp = () => {
    if (!whatsappPhoneNumber) {
      alert('Veuillez entrer un numéro de téléphone WhatsApp.');
      return;
    }

    // Generate PDF first so user can download it
    generatePDF();

    const message = encodeURIComponent(`Bonjour, voici votre facture ${invoice.id}. Veuillez trouver le PDF ci-joint.`);
    const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    alert('Veuillez joindre manuellement le PDF de la facture que vous venez de télécharger dans WhatsApp.');
  };

  const vatDetails = invoice.items.reduce((acc: any, item: any) => {
    const rate = item.vat_rate;
    if (!acc[rate]) {
      acc[rate] = { subtotal: 0, vatAmount: 0 };
    }
    acc[rate].subtotal += item.total_ht;
    acc[rate].vatAmount += (item.total_ht * rate) / 100;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Aperçu de la Facture {invoice.id}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
            >
              <Printer size={14} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={generatePDF}
              className="bg-blue-600 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>
            {/* WhatsApp Send Button and Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={whatsappPhoneNumber}
                onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                placeholder="Numéro WhatsApp"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
              />
              <button
                onClick={handleSendWhatsApp}
                className="bg-green-500 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
              >
                <MessageSquareText size={14} /> {/* Using Lucide icon */}
                <span>WhatsApp</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6" ref={invoiceRef}>
          <div className="max-w-5xl mx-auto bg-white border border-gray-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-300">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-base font-bold">{companyInfo?.name}</h1>
                  <div className="text-xs mt-1">
                    <p>{companyInfo?.address}</p>
                    <p>{companyInfo?.postal_code} {companyInfo?.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">IBAN: {companyInfo?.iban}</p>
                  <p className="font-semibold">TVA: {companyInfo?.vat_number}</p>
                </div>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="p-4 border-b border-gray-300">
              <h2 className="text-lg font-bold">FACTURE</h2>
            </div>

            {/* Invoice Details */}
            <div className="p-4 border-b border-gray-300 bg-gray-100">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">N° Facture</span>
                  <p>{invoice.id}</p>
                </div>
                <div>
                  <span className="font-semibold">Date</span>
                  <p>{new Date(invoice.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="font-semibold">Code client</span>
                  <p>{invoice.client?.code}</p>
                </div>
                <div>
                  <span className="font-semibold">Nom client</span>
                  <p>{invoice.client?.name}</p>
                  <p>{invoice.client?.address}</p>
                  <p>{invoice.client?.postal_code} {invoice.client?.city}</p>
                  <p>{invoice.client?.vat_intra} </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-b border-gray-300">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2 border-r border-gray-300">Designation</th>
                    <th className="text-center p-2 border-r border-gray-300 w-12">Qte</th>
                    <th className="text-right p-2 border-r border-gray-300 w-20">P.U HT</th>
                    <th className="text-center p-2 border-r border-gray-300 w-12">Rem</th>
                    <th className="text-center p-2 border-r border-gray-300 w-12">TVA</th>
                    <th className="text-right p-2 border-r border-gray-300 w-20">P.U TTC</th>
                    <th className="text-right p-2 w-20">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 border-r border-gray-300">{item.product_name}</td>
                      <td className="p-2 text-center border-r border-gray-300">{item.quantity}</td>
                      <td className="p-2 text-right border-r border-gray-300">{formatCurrency(item.price_ht)} €</td>
                      <td className="p-2 text-center border-r border-gray-300"></td>
                      <td className="p-2 text-center border-r border-gray-300">{item.vat_rate}%</td>
                      <td className="p-2 text-right border-r border-gray-300">
                        {formatCurrency(item.price_ht * (1 + item.vat_rate/100))} €
                      </td>
                      <td className="p-2 text-right">{formatCurrency(item.total_ht)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-4 border-b border-gray-300">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Total HT:</span>
                    <span>{formatCurrency(invoice.subtotal)} €</span>
                  </div>
                  {Object.entries(vatDetails).map(([rate, details]: [string, any]) => (
                    <div key={rate} className="flex justify-between mb-1 text-sm">
                      <span>TVA {rate}%:</span>
                      <span>{formatCurrency(details.vatAmount)} €</span>
                    </div>
                  ))}
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-300 font-semibold">
                    <span>TOTAL TTC:</span>
                    <span>{formatCurrency(invoice.total)} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="p-4 text-sm">
              <p className="font-semibold mb-2">Mode de règlement : {invoice.payment_method}</p>
              <p className="font-semibold">
                Arrêté la présente facture à la somme de : {toWords.convert(invoice.total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
