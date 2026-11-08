// Dashboard displaying user accounts, derived ledger balances, and expandable ledger entry histories
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // States for expandable ledger history per account
  const [expandedLedgers, setExpandedLedgers] = useState({});
  const [ledgerEntries, setLedgerEntries] = useState({});
  const [ledgerLoading, setLedgerLoading] = useState({});
  const [ledgerError, setLedgerError] = useState({});

  const navigate = useNavigate();

  // Fetch all accounts and their respective derived ledger balances
  const loadAccounts = async () => {
    setError('');
    try {
      const res = await api.get('/api/accounts');
      const accountList = res.data?.accounts || [];
      setAccounts(accountList);

      // Fetch balances for each account concurrently
      const balanceMap = {};
      await Promise.all(
        accountList.map(async (acc) => {
          try {
            const bRes = await api.get(`/api/accounts/${acc._id}/balance`);
            // Response format from backend: { account_id: "...", balance: 0 }
            balanceMap[bRes.data.account_id] = bRes.data.balance;
          } catch (err) {
            console.error(`Failed to fetch balance for ${acc._id}`, err);
            balanceMap[acc._id] = 'Error';
          }
        })
      );
      setBalances(balanceMap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Fetch ledger entries when the user toggles "View entries"
  const toggleLedger = async (accountId) => {
    const isCurrentlyExpanded = Boolean(expandedLedgers[accountId]);

    setExpandedLedgers((prev) => ({
      ...prev,
      [accountId]: !isCurrentlyExpanded,
    }));

    // If opening and not yet loaded (or refreshing)
    if (!isCurrentlyExpanded && !ledgerEntries[accountId]) {
      setLedgerLoading((prev) => ({ ...prev, [accountId]: true }));
      setLedgerError((prev) => ({ ...prev, [accountId]: '' }));
      try {
        const res = await api.get(`/api/accounts/${accountId}/ledger`);
        setLedgerEntries((prev) => ({
          ...prev,
          [accountId]: res.data?.entries || [],
        }));
      } catch (err) {
        setLedgerError((prev) => ({
          ...prev,
          [accountId]: err.response?.data?.message || 'Failed to load ledger entries',
        }));
      } finally {
        setLedgerLoading((prev) => ({ ...prev, [accountId]: false }));
      }
    }
  };

  // Create a new account for the logged-in user
  const handleCreateAccount = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post('/api/accounts');
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setActionLoading(false);
    }
  };

  // Logout the user and clear storage
  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      navigate('/login');
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/20 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Accounts & Balances</h1>
          <p className="text-xs text-white/60 mt-1">
            Balances are calculated dynamically by summing ledger credits and debits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateAccount}
            disabled={actionLoading}
            className="border border-white bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/90 disabled:opacity-50"
          >
            {actionLoading ? 'Creating...' : '+ Create Account'}
          </button>
          <button
            onClick={handleLogout}
            className="border border-white/40 text-white px-4 py-2 text-xs uppercase tracking-wider hover:border-white hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 border border-white p-3 text-xs bg-white text-black font-semibold">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center text-sm text-white/50 tracking-wider uppercase">
          Loading accounts and verifying ledger entries...
        </div>
      ) : accounts.length === 0 ? (
        <div className="mt-10 border border-white/20 p-12 text-center bg-black">
          <p className="text-sm text-white/70 mb-4">You do not have any accounts yet.</p>
          <button
            onClick={handleCreateAccount}
            disabled={actionLoading}
            className="border border-white bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/90"
          >
            Create Your First Account
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => {
            const balance = balances[acc._id];
            const isExpanded = Boolean(expandedLedgers[acc._id]);
            const entries = ledgerEntries[acc._id] || [];
            const isEntriesLoading = Boolean(ledgerLoading[acc._id]);
            const entryErr = ledgerError[acc._id];

            return (
              <div
                key={acc._id}
                className="border border-white/20 p-6 bg-black flex flex-col justify-between hover:border-white/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-white/60 border-b border-white/10 pb-3 mb-4">
                    <span className="uppercase tracking-widest">{acc.currency || 'INR'} WALLET</span>
                    <span className="px-2 py-0.5 border border-white/30 text-[10px] tracking-wider uppercase">
                      {acc.status}
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="text-xs uppercase tracking-wider text-white/50 mb-1">
                      Derived Balance
                    </div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tight">
                      {balance !== undefined ? (
                        <>
                          <span className="text-base text-white/60 font-sans mr-1">{acc.currency || 'INR'}</span>
                          {typeof balance === 'number' ? balance.toLocaleString() : balance}
                        </>
                      ) : (
                        <span className="text-sm text-white/40">Calculating...</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs bg-white/5 p-3 border border-white/10 font-mono flex items-center justify-between gap-2">
                    <span className="text-white/70 truncate text-[11px]">{acc._id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc._id)}
                      className="text-[10px] text-white underline hover:no-underline whitespace-nowrap uppercase tracking-wider"
                    >
                      {copiedId === acc._id ? 'Copied' : 'Copy ID'}
                    </button>
                  </div>
                </div>

                {/* Ledger Entries Expandable Section */}
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleLedger(acc._id)}
                      className="text-xs uppercase tracking-wider text-white/80 hover:text-white flex items-center gap-1 font-mono"
                    >
                      <span>{isExpanded ? '[-] Hide entries' : '[+] View entries'}</span>
                    </button>
                    <Link
                      to="/transfer"
                      state={{ preselectedAccount: acc._id }}
                      className="text-xs uppercase tracking-wider text-white hover:underline underline-offset-4"
                    >
                      Transfer →
                    </Link>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border border-white/20 p-3 bg-white/[0.02]">
                      {isEntriesLoading ? (
                        <div className="text-center py-4 text-xs text-white/50 font-mono">
                          Loading ledger records...
                        </div>
                      ) : entryErr ? (
                        <div className="text-center py-2 text-xs text-white font-mono">
                          {entryErr}
                        </div>
                      ) : entries.length === 0 ? (
                        <div className="text-center py-4 text-xs text-white/50 font-mono">
                          No entries yet
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-xs">
                            <thead>
                              <tr className="border-b border-white/20 text-white/50 text-[10px] uppercase">
                                <th className="pb-2">Type</th>
                                <th className="pb-2">Amount</th>
                                <th className="pb-2">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {entries.map((entry) => (
                                <tr key={entry._id} className="text-white/90">
                                  <td className="py-2">
                                    <span
                                      className={`px-1.5 py-0.5 text-[10px] border ${
                                        entry.type === 'CREDIT'
                                          ? 'border-white text-white font-bold'
                                          : 'border-white/40 text-white/70'
                                      }`}
                                    >
                                      {entry.type}
                                    </span>
                                  </td>
                                  <td className="py-2">
                                    {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount}
                                  </td>
                                  <td className="py-2 text-[11px] text-white/60">
                                    {entry.transaction?.createdAt
                                      ? new Date(entry.transaction.createdAt).toLocaleDateString()
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40">
                  Created: {new Date(acc.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
