import { useState, useRef, DragEvent } from 'react';
import toast from 'react-hot-toast';
import { importApi, getErrorMessage } from '../../services/api';
import { ImportResult } from '../../types';
import { Card, CardHeader, CardBody, Button } from '../../components/UI';

export function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('Only Excel files (.xlsx, .xls) are supported');
      return;
    }
    setFile(f);
    setResult(null);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const res = await importApi.uploadExcel(file);
      setResult(res);
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Excel</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload the pricing Excel file to import or update products. The import is idempotent — safe to run multiple times.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Upload File</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <div className="text-4xl mb-3">📊</div>
            {file ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Drop Excel file here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse (.xlsx, .xls)</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file}
              loading={uploading}
              size="lg"
              className="flex-1"
            >
              {uploading ? 'Importing...' : '🚀 Import Now'}
            </Button>
            {file && (
              <Button variant="secondary" onClick={() => { setFile(null); setResult(null); }}>
                Clear
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Import instructions */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Import Notes</h2>
        </CardHeader>
        <CardBody>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li>✅ Products are matched by <strong>Indoor EPN</strong> — duplicates are updated, not inserted again</li>
            <li>✅ Charges (customs, freight, handling) are imported from rows 1–3 of each sheet</li>
            <li>✅ Margin percentages (15%, 20%, 23%, 27%, 30%) are seeded if not already present</li>
            <li>✅ Indoor and outdoor unit pairs are automatically linked</li>
            <li>✅ Empty rows and invalid data are safely skipped</li>
            <li>⚠️ Running the import again will overwrite all product fields for matching EPN numbers</li>
          </ul>
        </CardBody>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-xl">{result.success ? '✅' : '❌'}</span>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {result.success ? 'Import Successful' : 'Import Failed'}
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">{result.message}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.details.products_imported}</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">New Products</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.details.products_updated}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Updated</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{result.details.charges_imported}</p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Charges</p>
              </div>
            </div>

            {result.details.warnings?.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Warnings</p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                  {result.details.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {result.details.errors?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">❌ Errors</p>
                <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                  {result.details.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
