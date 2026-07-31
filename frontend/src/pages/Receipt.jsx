import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, MapPin, Phone, Mail, Globe, 
  CheckCircle, ArrowLeft, Download, Printer, 
  Share2, FileText, User, Calendar, CreditCard,
  Briefcase, Activity, AlertTriangle, QrCode,
  Shield, CircleCheck, CheckCircle2, ChevronRight, Lock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Receipt = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await api.get(`/premiums/${id}/receipt`);
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load receipt data');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center print:hidden">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="font-medium tracking-wide">Loading secure receipt...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500 font-semibold">Receipt not found</div>;

  const { payment, policy, customer, next_premium } = data;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingPDF(true);
      
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${payment.receipt_number}.pdf`);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getReminderConfig = () => {
    if (next_premium.days_remaining < 0) {
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', iconBg: 'bg-red-100', icon: 'text-red-600', label: 'Overdue by', days: Math.abs(next_premium.days_remaining) };
    }
    if (next_premium.days_remaining <= 15) {
      return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100', icon: 'text-amber-600', label: 'Due in', days: next_premium.days_remaining };
    }
    return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100', icon: 'text-emerald-600', label: 'Due in', days: next_premium.days_remaining };
  };

  const reminder = getReminderConfig();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 print:px-0">
      
      {/* Actions Top Bar - Hidden in Print */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link to="/premiums" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/30">
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>

      <motion.div 
        ref={receiptRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto bg-white rounded-[24px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:max-w-full print:rounded-none"
      >
        {/* Premium Header - Gradient */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-8 py-12 md:px-12 text-white print:bg-white print:text-slate-900 print:border-b print:border-slate-200">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] print:hidden"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg print:bg-indigo-600 print:border-0">
                  <ShieldCheck className="text-white w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">AegisOne</h1>
                  <p className="text-indigo-200 font-medium tracking-wide print:text-slate-500">Global Financial Protection</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-indigo-100 print:text-slate-500">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-70" /> 123 Enterprise Blvd, Financial District, City 40001</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 opacity-70" /> +1 (800) INSURE-PRO</div>
              </div>
            </div>
            
            <div className="text-left md:text-right w-full md:w-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 font-bold text-sm mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)] print:bg-emerald-50 print:text-emerald-700 print:border-emerald-200 print:shadow-none">
                <CheckCircle2 className="w-5 h-5" />
                PAYMENT SUCCESSFUL
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold mb-1 print:text-slate-400">Receipt Number</p>
                  <p className="font-semibold text-lg font-mono">{payment.receipt_number}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold mb-1 print:text-slate-400">Transaction ID</p>
                  <p className="font-mono text-indigo-100 print:text-slate-600">{payment.transaction_id}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold mb-1 print:text-slate-400">Date & Time</p>
                  <p className="font-medium text-indigo-100 print:text-slate-600">{payment.issue_date} • {payment.issue_time}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-8 md:p-12 bg-slate-50/50 print:bg-white print:p-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Customer Glass Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 print:shadow-none print:border print:border-slate-200">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500 print:text-slate-400" /> Billed To
              </h2>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-slate-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl border border-indigo-100 shadow-inner">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{customer.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">ID: {customer.id.split('-')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-amber-600 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> {customer.loyalty_tier || 'Gold'} Member
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">Since {customer.since}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="font-medium text-slate-700 leading-relaxed max-w-[250px]">{customer.address}</span>
                </div>
              </div>
            </motion.div>

            {/* Policy Glass Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 print:shadow-none print:border print:border-slate-200">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500 print:text-slate-400" /> Coverage Details
              </h2>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{policy.policy_name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md uppercase tracking-wide">
                    {policy.policy_type}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md uppercase border border-emerald-200 tracking-wide">
                    {policy.status}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md uppercase border border-indigo-100 tracking-wide font-mono">
                    {policy.policy_number}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                  <span className="text-slate-500 font-medium">Coverage Amount</span>
                  <span className="font-extrabold text-slate-900 text-base">₹{policy.coverage_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                  <span className="text-slate-500 font-medium">Validity Period</span>
                  <span className="font-medium text-slate-700">{policy.start_date} to {policy.end_date}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-slate-500 font-medium">Assigned Agent</span>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-700">{policy.agent_id ? policy.agent_id.split('-')[0].toUpperCase() : 'Direct'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Timeline Area (1/3 width) */}
            <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 print:shadow-none print:border print:border-slate-200">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-8 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500 print:text-slate-400" /> Journey
              </h2>
              
              <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-emerald-400 before:to-slate-100 print:before:bg-slate-200">
                
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="absolute -left-[35px] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center print:border-emerald-500">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Initiated</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{payment.initiated_at.replace('T', ' ').substring(0, 16)}</p>
                </div>
                
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="absolute -left-[35px] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center print:border-emerald-500">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Bank Auth</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">Verified by gateway</p>
                </div>

                <div className="relative z-10 flex flex-col gap-1">
                  <div className="absolute -left-[37px] w-7 h-7 bg-emerald-50 rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)] print:shadow-none">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse print:animate-none"></div>
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-700">Successful</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{payment.processed_at.replace('T', ' ').substring(0, 16)}</p>
                </div>

              </div>
            </motion.div>

            {/* Payment Summary (2/3 width) */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border print:border-slate-200">
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500 print:text-slate-400" /> Transaction Summary
                </h2>
              </div>
              
              <div className="px-6 py-4 space-y-4 text-sm">
                <div className="flex justify-between items-center group hover:bg-slate-50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                  <span className="text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Base Premium</span>
                  <span className="font-semibold text-slate-900">₹{payment.base_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center group hover:bg-slate-50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                  <span className="text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Tax (18% GST)</span>
                  <span className="font-semibold text-slate-900">₹{payment.tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center group hover:bg-slate-50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                  <span className="text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Processing Fee</span>
                  <span className="font-semibold text-slate-900">₹{payment.processing_fee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                {payment.discount > 0 && (
                  <div className="flex justify-between items-center group bg-emerald-50/50 -mx-4 px-4 py-2 rounded-lg border border-emerald-100/50">
                    <span className="text-emerald-700 font-medium flex items-center gap-2">Loyalty Discount <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{customer.loyalty_tier || 'GOLD'}</span></span>
                    <span className="font-bold text-emerald-600">-₹{payment.discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Highlights */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 md:p-8 text-white print:bg-slate-50 print:text-slate-900 print:border-t print:border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                    <p className="text-indigo-200 text-sm font-medium mb-2 print:text-slate-500">Total Amount Paid</p>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-white/10 border border-white/20 text-white text-xs font-bold rounded backdrop-blur-sm print:bg-slate-200 print:text-slate-700 print:border-0">INR</span>
                      <span className="text-sm font-medium text-indigo-100 flex items-center gap-1.5 print:text-slate-600">
                        <CreditCard className="w-4 h-4" /> Paid via {payment.method}
                      </span>
                    </div>
                  </div>
                  <div className="text-5xl font-black tracking-tight drop-shadow-md print:drop-shadow-none">
                    ₹{payment.total_paid.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>

        {/* Footer info (Reminders & Security) */}
        <div className="p-8 md:p-12 bg-white flex flex-col lg:flex-row justify-between items-center gap-8 border-t border-slate-100">
          
          <motion.div variants={itemVariants} className={`flex items-start gap-4 w-full lg:w-1/2 p-5 rounded-2xl border ${reminder.bg} print:border print:border-slate-200`}>
            <div className={`p-3 rounded-xl flex-shrink-0 ${reminder.iconBg} ${reminder.icon}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-sm uppercase tracking-widest font-bold mb-1.5 ${reminder.text}`}>Next Premium</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-slate-900">₹{next_premium.amount.toLocaleString()}</span>
                <span className="text-sm font-medium text-slate-500">{reminder.label} <strong className={`font-bold ${reminder.text}`}>{reminder.days} days</strong></span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold tracking-wide">
                <span className="px-2.5 py-1 bg-white rounded-md text-slate-600 border border-slate-200 shadow-sm">
                  DUE: {next_premium.due_date}
                </span>
                {next_premium.auto_pay && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 shadow-sm flex items-center gap-1">
                    <Activity className="w-3 h-3" /> AUTOPAY ACTIVE
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="w-full lg:w-1/2 flex flex-col md:flex-row items-center justify-end gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 print:border-0 print:bg-transparent print:p-0">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> 256-bit AES Encryption
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 print:border-0 print:bg-transparent print:p-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Fraud Protected
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 print:border-0 print:bg-transparent print:p-0">
                <FileText className="w-3.5 h-3.5 text-emerald-500" /> Verified Digital Receipt
              </div>
            </div>
            
            <div className="w-28 h-28 bg-white rounded-xl p-2.5 shadow-sm border border-slate-200 flex flex-col items-center justify-center print:shadow-none print:border-slate-300">
              <QrCode className="w-full h-full text-slate-800" />
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Verify</span>
            </div>
          </motion.div>

        </div>

        {/* Legal Footer */}
        <div className="bg-slate-900 text-slate-400 p-8 text-center print:bg-white print:text-slate-500 print:border-t print:border-slate-200">
          <div className="flex justify-center items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-500 print:text-slate-400" />
            <span className="text-white font-bold tracking-wider print:text-slate-800">AegisOne</span>
          </div>
          <p className="text-xs mb-2 leading-relaxed max-w-2xl mx-auto">
            This is a computer generated premium payment receipt and does not require a physical signature. 
            All transactions are subject to the terms and conditions outlined in your policy document.
          </p>
          <div className="flex justify-center items-center gap-4 text-[11px] font-medium mt-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Support Center</a>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Receipt;
