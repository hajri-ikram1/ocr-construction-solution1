import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/api/ia/logs');
      setLogs(response.data.logs || []);
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Erreur récupération logs:', err);
      setError("Impossible de récupérer les logs. Vérifiez que le backend et le microservice IA sont lancés.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const badgeColor = (score) => {
    if (score === null || score === undefined) return '#94a3b8';
    if (score < 60) return '#dc2626';
    if (score < 90) return '#d97706';
    return '#16a34a';
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>📊 Dashboard — Suivi des Performances IA</h1>
        <p style={{ color: '#64748b', fontSize: '16px', margin: '0' }}>Confiance moyenne, temps de traitement et historique des analyses</p>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
          <button onClick={fetchLogs} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            🔄 Rafraîchir
          </button>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#2563eb', fontWeight: '600' }}>Chargement des statistiques...</p>}

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Cartes de statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0' }}>Documents analysés</p>
                <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{stats.total_documents ?? '—'}</p>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0' }}>Confiance moyenne</p>
                <p style={{ color: badgeColor(stats.confiance_moyenne), fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                  {stats.confiance_moyenne !== null && stats.confiance_moyenne !== undefined ? `${stats.confiance_moyenne}%` : '—'}
                </p>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0' }}>Temps moyen</p>
                <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                  {stats.temps_moyen_secondes !== null && stats.temps_moyen_secondes !== undefined ? `${stats.temps_moyen_secondes}s` : '—'}
                </p>
              </div>
            </div>

            {/* Historique */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#334155', marginTop: '0' }}>🕒 Historique des analyses récentes</h3>

              {logs.length === 0 && (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>Aucune analyse enregistrée pour le moment.</p>
              )}

              {logs.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Type</th>
                      <th style={{ padding: '10px' }}>Fichier</th>
                      <th style={{ padding: '10px' }}>Confiance</th>
                      <th style={{ padding: '10px' }}>Temps (s)</th>
                      <th style={{ padding: '10px' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...logs].reverse().map((log, index) => (
                      <tr key={index} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px' }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '10px' }}>{log.document_type}</td>
                        <td style={{ padding: '10px' }}>{log.filename}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: badgeColor(log.confidence_score), fontWeight: '600' }}>
                            {log.confidence_score ?? '—'}{log.confidence_score !== null && log.confidence_score !== undefined ? '%' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>{log.processing_time_seconds}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: log.status === 'SUCCESS' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;