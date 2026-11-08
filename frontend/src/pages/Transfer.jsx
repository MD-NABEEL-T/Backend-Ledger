// Transfer funds between accounts with automatic UUID idempotency key generation
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Transfer() {
  const location = useLocation();
  const preselected = location.state?.preselectedAccount || '';

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState(preselected);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [error, setError] = useState('');

  // Fetch the current user's accounts to populate the dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/api/accounts');
        const list = res.data?.accounts || [];
        setAccounts(list);
        if (list.length > 0 && !preselected) {
          setFromAccount(list[0]._id);
        }
      } catch (err) {
        setError('Failed to load your accounts. Please ensure you are logged in.');
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [preselected]);

  // Handle transfer submission with cryptographic UUID for idempotency
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!fromAccount) {
      setError('Please select a source account.');
      return;
    }

    if (!toAccount.trim()) {
      setError('Please enter a destination account ID.');
      return;
    }

    if (fromAccount === toAccount.trim()) {
      setError('Source and destination accounts cannot be the same.');
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    // Generate idempotency key with crypto.randomUUID()
    const idempotencyKey = crypto.randomUUID();

    setSubmitting(true);
    try {
      const response = await api.post('/api/transactions', {
        fromAccount,
        toAccount: toAccount.trim(),
        amount: numericAmount,
        idempotencyKey,
      });

      setSuccessInfo({
        message: response.data?.message || 'Transaction processed successfully',
        transaction: response.data?.transaction,
        idempotencyKey,
      });

      // Reset input fields
      setAmount('');
      setToAccount('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Transaction failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="border border-white/20 p-8 bg-black">
        <div className="border-b border-white/20 pb-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight uppercase">Transfer Funds</h1>
          <p className="text-xs text-white/60 mt-1">
            Transfers atomically create matching DEBIT and CREDIT ledger entries.
          </p>
        </div>

        {/* Success message */}
        {successInfo && (
          <div className="mb-6 border border-white p-4 bg-white text-black">
            <div className="text-xs font-bold uppercase tracking-wider mb-2">
              ✓ {successInfo.message}
            </div>
            {successInfo.transaction && (
              <div className="text-xs font-mono space-y-1">
                <div>Transaction ID: {successInfo.transaction._id}</div>
                <div>Status: {successInfo.transaction.status}</div>
                <div>Amount: ₹{successInfo.transaction.amount}</div>
                <div className="text-[10px] text-black/70 truncate">
                  Key: {successInfo.idempotencyKey}
                </div>
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-black/20 text-xs">
              <Link to="/dashboard" className="font-bold underline underline-offset-4">
                View updated balance on Dashboard →
              </Link>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 border border-white p-3 text-xs bg-white text-black font-semibold">
            {error}
          </div>
        )}

        {loadingAccounts ? (
          <div className="py-12 text-center text-xs text-white/50 uppercase tracking-wider">
            Loading your accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-white/70 mb-4">You have no accounts available to transfer from.</p>
            <Link
              to="/dashboard"
              className="inline-block border border-white bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Go to Dashboard to Create One
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Account */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/80 mb-2">
                From Account (Your Account)
              </label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-white font-mono"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id} className="bg-black text-white">
                    {acc._id} ({acc.currency || 'INR'} - {acc.status})
                  </option>
                ))}
              </select>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/80 mb-2">
                To Account (Destination Account ID)
              </label>
              <input
                type="text"
                required
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                placeholder="Paste recipient's 24-character account ID"
                className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white font-mono"
              />
              <span className="block text-[11px] text-white/40 mt-1">
                Tip: Copy another account ID from your Dashboard or use a colleague's ID.
              </span>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/80 mb-2">
                Amount (INR)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white font-mono"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Executing Transfer...' : 'Confirm & Transfer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

