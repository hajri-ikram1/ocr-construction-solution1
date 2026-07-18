import React, { useState } from 'react';
import axios from 'axios';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typeUpload, setTypeUpload] = useState('facture'); // 'facture', 'plan' ou 'bl'

  const [extractedData, setExtractedData] = useState(null);
  const [rawBackendResponse, setRawBackendResponse] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeField, setActiveField] = useState(null); // champ actuellement survolé/focus, pour la surbrillance sur l'image

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setExtractedData(null);
      setRawBackendResponse(null);
      setIsSaved(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("S'il vous plaît, sélectionnez un document !");

    setLoading(true);
    setExtractedData(null);
    setRawBackendResponse(null);
    setIsSaved(false);

    const formData = new FormData();
    formData.append('file', file);

    let endpoint = 'http://localhost:3000/api/ia/upload-facture';
    if (typeUpload === 'plan') {
      endpoint = 'http://localhost:3000/api/ia/upload-plan';
    } else if (typeUpload === 'bl') {
      endpoint = 'http://localhost:3000/api/ia/upload-bl';
    }

    try {
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log("Réponse Backend brute:", response.data);
      setRawBackendResponse(response.data);

      if (typeUpload === 'facture') {
        setExtractedData(response.data);
      } else if (typeUpload === 'plan') {
        if (response.data && response.data.estimation_plan) {
          setExtractedData(response.data.estimation_plan);
        } else {
          setExtractedData(response.data);
        }
      } else if (typeUpload === 'bl') {
        if (response.data && response.data.donnees_extraites) {
          setExtractedData(response.data.donnees_extraites);
        } else {
          setExtractedData(response.data);
        }
      }

    } catch (error) {
      console.error("Erreur lors de l'appel API:", error);
      setRawBackendResponse(error.response ? error.response.data : { error: "Crash serveur complet / Pas de réponse" });
      alert("⚠️ Erreur lors de l'analyse du document par l'IA.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢🟠🔴 Badge de confiance IA (exigence CDC 6.2 : "logging des performances et taux de confiance")
  const renderConfidenceBadge = () => {
    const score = extractedData?.confidence_score;
    if (score === undefined || score === null || score === '') return null;

    const numericScore = Number(score);
    let color = '#16a34a'; // vert
    let bg = '#f0fdf4';
    let label = 'Confiance élevée';

    if (numericScore < 60) {
      color = '#dc2626'; // rouge
      bg = '#fef2f2';
      label = 'Confiance faible — vérifiez attentivement';
    } else if (numericScore < 90) {
      color = '#d97706'; // orange
      bg = '#fffbeb';
      label = 'Confiance moyenne';
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: bg, color, border: `1px solid ${color}`, borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
        {label} — {numericScore}%
      </div>
    );
  };

  // 🖍️ Surbrillance des zones extraites sur le document source (exigence CDC 6.1)
  // Convertit les box_2d (échelle 0-1000 : [ymin, xmin, ymax, xmax]) en % pour un positionnement
  // absolu qui reste correct quelle que soit la taille réelle de l'image affichée.
  const renderZonesOverlay = () => {
    const zones = extractedData?.zones;
    if (!zones || !Array.isArray(zones) || zones.length === 0) return null;

    return zones.map((zone, index) => {
      if (!zone.box_2d || zone.box_2d.length !== 4) return null;
      const [ymin, xmin, ymax, xmax] = zone.box_2d;
      const isActive = activeField === zone.champ;

      const style = {
        position: 'absolute',
        top: `${ymin / 10}%`,
        left: `${xmin / 10}%`,
        width: `${(xmax - xmin) / 10}%`,
        height: `${(ymax - ymin) / 10}%`,
        border: isActive ? '3px solid #2563eb' : '2px solid rgba(37, 99, 235, 0.35)',
        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
        borderRadius: '4px',
        pointerEvents: 'none',
        transition: 'all 0.15s ease',
        boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none',
        zIndex: isActive ? 2 : 1,
      };

      return <div key={index} style={style} />;
    });
  };

  const handleInputChange = (field, value, index = null, subField = null) => {
    if (!extractedData) return;

    if (index !== null && subField !== null) {
      const updatedList = [...extractedData[field]];
      updatedList[index][subField] = value;
      setExtractedData({ ...extractedData, [field]: updatedList });
    } else {
      setExtractedData({ ...extractedData, [field]: value });
    }
  };

  const handleFinalValidation = async () => {
    if (!extractedData) return alert("Aucune donnée à valider !");

    try {
      if (typeUpload === 'facture') {
        await axios.post('http://localhost:3000/api/ia/valider-facture', extractedData);
        alert("🎯 Facture validée avec succès !");
      }
      else if (typeUpload === 'plan') {
        await axios.post('http://localhost:3000/api/ia/valider-devis-plan', extractedData);
        alert("🎯 Devis validé avec succès !");
      }
      else if (typeUpload === 'bl') {
        await axios.post('http://localhost:3000/api/ia/valider-bl', {
          fournisseur: extractedData.fournisseur,
          numero_bl: extractedData.numero_bl,
          date_livraison: extractedData.date_livraison,
          articles_livres: extractedData.articles_livres
        });
        alert("🎯 Stock mis à jour avec succès !");
      }
      setIsSaved(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Détail de l'erreur backend:", error.response?.data);
      alert("❌ Erreur Oracle : " + errorMessage);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>📄 Système Intelligent OCR & Gestion de Stocks</h1>
        <p style={{ color: '#64748b', fontSize: '16px', margin: '0' }}>Traitement de Factures, Estimations & Stocks (Version PFE 2026)</p>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '20px' }}>
          <label style={{ fontWeight: '600', fontSize: '15px', cursor: 'pointer', color: typeUpload === 'facture' ? '#2563eb' : '#475569' }}>
            <input type="radio" name="docType" checked={typeUpload === 'facture'} onChange={() => { setTypeUpload('facture'); setExtractedData(null); setRawBackendResponse(null); setIsSaved(false); }} style={{ marginRight: '8px' }} />
            OCR Facture Fournisseur (P0)
          </label>
          <label style={{ fontWeight: '600', fontSize: '15px', cursor: 'pointer', color: typeUpload === 'plan' ? '#2563eb' : '#475569' }}>
            <input type="radio" name="docType" checked={typeUpload === 'plan'} onChange={() => { setTypeUpload('plan'); setExtractedData(null); setRawBackendResponse(null); setIsSaved(false); }} style={{ marginRight: '8px' }} />
            Estimation Plan d'Architecte (P0)
          </label>
          <label style={{ fontWeight: '600', fontSize: '15px', cursor: 'pointer', color: typeUpload === 'bl' ? '#10b981' : '#475569' }}>
            <input
              type="radio"
              name="docType"
              checked={typeUpload === 'bl'}
              onChange={() => { setTypeUpload('bl'); setExtractedData(null); setRawBackendResponse(null); setIsSaved(false); }}
              style={{ marginRight: '8px', accentColor: '#10b981' }}
            />
            📈 OCR Bon de Livraison {"->"} Stock (P1)
          </label>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #cbd5e1', padding: '25px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ cursor: 'pointer' }} />
          <button type="submit" disabled={loading} style={{ marginTop: '20px', backgroundColor: loading ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', width: '220px' }}>
            {loading ? 'Analyse en cours...' : "Lancer l'Analyse IA"}
          </button>
        </form>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: '30px' }}>

        {previewUrl && (
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: 'fit-content' }}>
            <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#334155', marginTop: '0' }}>🖼️ Aperçu du Document Source</h3>
            {extractedData?.zones?.length > 0 && (
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                💡 Cliquez sur un champ à droite pour voir sa position en surbrillance ici.
              </p>
            )}
            <div style={{ width: '100%', maxHeight: '600px', overflowY: 'auto', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                <img src={previewUrl} alt="Aperçu" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', display: 'block' }} />
                {renderZonesOverlay()}
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#334155', marginTop: '0' }}>🎯 Données Extraites par l'IA</h3>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontWeight: '600', color: '#2563eb' }}>Analyse et extraction automatique en cours...</p>
            </div>
          )}

          {!loading && !extractedData && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <p style={{ fontSize: '16px' }}>Veuillez uploader un document et cliquer sur lancer l'analyse.</p>
            </div>
          )}

          {!loading && extractedData && (
            <div>
              <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', color: '#1e40af' }}>
                👉 Vous pouvez modifier les valeurs extraites ci-dessous avant de valider.
              </div>

              {renderConfidenceBadge()}

              {typeUpload === 'facture' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Nom du Fournisseur</label>
                    <input type="text" value={extractedData.fournisseur || ''} onChange={(e) => handleInputChange('fournisseur', e.target.value)} onFocus={() => setActiveField('fournisseur')} onBlur={() => setActiveField(null)} style={{ width: '95%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Date Facture</label>
                      <input type="text" value={extractedData.date_facture || ''} onChange={(e) => handleInputChange('date_facture', e.target.value)} onFocus={() => setActiveField('date_facture')} onBlur={() => setActiveField(null)} style={{ width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Numéro Facture</label>
                      <input type="text" value={extractedData.numero_facture || ''} onChange={(e) => handleInputChange('numero_facture', e.target.value)} onFocus={() => setActiveField('numero_facture')} onBlur={() => setActiveField(null)} style={{ width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Total HT</label>
                      <input type="text" value={extractedData.total_ht || ''} onChange={(e) => handleInputChange('total_ht', e.target.value)} onFocus={() => setActiveField('total_ht')} onBlur={() => setActiveField(null)} style={{ width: '85%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>TVA</label>
                      <input type="text" value={extractedData.tva_taux || ''} onChange={(e) => handleInputChange('tva_taux', e.target.value)} onFocus={() => setActiveField('tva_taux')} onBlur={() => setActiveField(null)} style={{ width: '85%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Total TTC</label>
                      <input type="text" value={extractedData.total_ttc || ''} onChange={(e) => handleInputChange('total_ttc', e.target.value)} onFocus={() => setActiveField('total_ttc')} onBlur={() => setActiveField(null)} style={{ width: '85%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>
              )}

              {typeUpload === 'plan' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>🏠 Pièces Détectées</h4>
                    {extractedData.pieces_detectees && extractedData.pieces_detectees.map((piece, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '10px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                        <input type="text" value={piece.nom_piece || ''} onChange={(e) => handleInputChange('pieces_detectees', e.target.value, index, 'nom_piece')} onFocus={() => setActiveField(`piece_${index + 1}`)} onBlur={() => setActiveField(null)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={piece.surface_estimee || ''} onChange={(e) => handleInputChange('pieces_detectees', e.target.value, index, 'surface_estimee')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={piece.cotes_visibles ? piece.cotes_visibles.join(', ') : ''} onChange={(e) => handleInputChange('pieces_detectees', e.target.value.split(', '), index, 'cotes_visibles')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>💼 Proposition de Devis</h4>
                    {extractedData.proposition_devis && extractedData.proposition_devis.map((ligne, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '10px', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                        <input type="text" value={ligne.prestation || ''} onChange={(e) => handleInputChange('proposition_devis', e.target.value, index, 'prestation')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={ligne.quantite || ''} onChange={(e) => handleInputChange('proposition_devis', e.target.value, index, 'quantite')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={ligne.unite || ''} onChange={(e) => handleInputChange('proposition_devis', e.target.value, index, 'unite')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={ligne.justification || ''} onChange={(e) => handleInputChange('proposition_devis', e.target.value, index, 'justification')} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {typeUpload === 'bl' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Fournisseur</label>
                      <input type="text" value={extractedData.fournisseur || ''} onChange={(e) => handleInputChange('fournisseur', e.target.value)} onFocus={() => setActiveField('fournisseur')} onBlur={() => setActiveField(null)} style={{ width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>N° Bon Livraison (BL)</label>
                      <input type="text" value={extractedData.numero_bl || ''} onChange={(e) => handleInputChange('numero_bl', e.target.value)} onFocus={() => setActiveField('numero_bl')} onBlur={() => setActiveField(null)} style={{ width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#10b981' }}>📦 Articles Livrés à ajouter au Stock</h4>
                    {extractedData.articles_livres && extractedData.articles_livres.map((art, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '15px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #a7f3d0' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#047857', fontWeight: '600' }}>Désignation Produit</label>
                          <input type="text" value={art.designation || ''} onChange={(e) => handleInputChange('articles_livres', e.target.value, index, 'designation')} style={{ width: '95%', padding: '6px', borderRadius: '4px', border: '1px solid #a7f3d0' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#047857', fontWeight: '600' }}>Quantité</label>
                          <input type="number" value={art.quantite_livree || 0} onChange={(e) => handleInputChange('articles_livres', parseInt(e.target.value) || 0, index, 'quantite_livree')} style={{ width: '80%', padding: '6px', borderRadius: '4px', border: '1px solid #a7f3d0' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '30px', borderTop: '2px solid #f1f5f9', paddingTop: '20px', textAlign: 'right' }}>
                <button onClick={handleFinalValidation} disabled={isSaved} style={{ backgroundColor: isSaved ? '#10b981' : (typeUpload === 'bl' ? '#10b981' : '#16a34a'), color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: isSaved ? 'default' : 'pointer' }}>
                  {isSaved ? '✓ Enregistré avec succès dans Oracle' : (typeUpload === 'bl' ? 'Incrémenter le Stock' : 'Valider et Confirmer')}
                </button>
              </div>
            </div>
          )}

          {rawBackendResponse && (
            <div style={{ marginTop: '30px', borderTop: '3px solid #e2e8f0', paddingTop: '15px' }}>
              <h4 style={{ color: '#ea580c', margin: '0 0 10px 0' }}>⚙️ Debugger : Réponse brute</h4>
              <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '15px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', maxHeight: '250px' }}>
                {JSON.stringify(rawBackendResponse, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default UploadPage;