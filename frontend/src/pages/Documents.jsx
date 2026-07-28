import React, { useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { UploadCloud, File, Download, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Documents = () => {
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState('CUSTOMER');
  const [entityId, setEntityId] = useState('');
  const [docType, setDocType] = useState('IDENTITY');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !entityId) {
      toast.error('Please provide a file and the Entity ID.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    formData.append('document_type', docType);

    try {
      setUploading(true);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      setFile(null);
      setEntityId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Document Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload and manage sensitive files securely.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Upload Document</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Entity Type</label>
              <select 
                value={entityType} 
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="POLICY">Policy</option>
                <option value="CLAIM">Claim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entity ID</label>
              <input 
                type="text" 
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="UUID"
                className="w-full border rounded-md px-3 py-2 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="IDENTITY">Identity Proof</option>
                <option value="ADDRESS">Address Proof</option>
                <option value="POLICY">Policy Document</option>
                <option value="CLAIM">Claim Evidence</option>
                <option value="MEDICAL">Medical Report</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${file ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.png,.jpg,.jpeg,.zip"
            />
            
            {file ? (
              <div className="text-center space-y-2">
                <File className="h-10 w-10 text-primary mx-auto" />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <X className="h-4 w-4" /> Remove
                </button>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="font-medium text-foreground">Click or drag file to this area to upload</p>
                <p className="text-xs text-muted-foreground">Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files</p>
                <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={handleUpload}
              disabled={uploading || !file}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Upload Document
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default Documents;
