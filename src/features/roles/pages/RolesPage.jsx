import React, { useState, useEffect } from 'react';
import { rolesApi } from '../api/rolesApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useUI } from '../../../shared/context/UIContext';
import './RolesPage.css';

const RolesPage = () => {
  const { hasPermission } = useAuth();
  const { toast, confirm } = useUI();
  const canManageRoles = hasPermission('roles.manage') || hasPermission('*');

  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Role Management States
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false); // 'details', 'edit', false
  const [editRoleData, setEditRoleData] = useState({ name: '', description: '', permissions: [] });

  // Custom Role State
  const [customRole, setCustomRole] = useState({ name: '', permissions: [] });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.allSettled([
        rolesApi.getRoles(),
        rolesApi.getPermissions()
      ]);

      if (rolesData.status === 'fulfilled') {
        const rList = Array.isArray(rolesData.value) ? rolesData.value : [];
        setRoles(rList);
      }
      if (permsData.status === 'fulfilled') {
        const pList = Array.isArray(permsData.value) ? permsData.value : [];
        setPermissions(pList);
      }
    } catch (err) {
      console.error('Rol verileri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRoleModal = async (role, mode) => {
    setSelectedRole(role);
    setShowRoleModal(mode);
    if (mode === 'edit') {
      try {
        const details = await rolesApi.getRoleById(role.id || role.name);
        setEditRoleData({
          name: details.name || '',
          description: details.description || '',
          permissions: details.permissions || []
        });
      } catch (err) {
        setEditRoleData({
          name: role.name || '',
          description: role.description || '',
          permissions: role.permissions || []
        });
      }
    }
  };

  const handleDeleteRole = async (roleId) => {
    confirm('Bu rolü kalıcı olarak silmek istediğinize emin misiniz?', async () => {
      try {
        await rolesApi.deleteRole(roleId);
        toast('Rol başarıyla silindi.', 'success');
        loadData();
      } catch (err) {
        toast('Rol silinemedi: ' + (err.response?.data?.message || err.message), 'error');
      }
    });
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await rolesApi.updateRole(selectedRole.id || selectedRole.name, editRoleData);
      toast('Rol başarıyla güncellendi.', 'success');
      setShowRoleModal(false);
      loadData();
    } catch (err) {
      toast('Rol güncellenemedi: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleRolePermToggle = (permName) => {
    setEditRoleData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName]
    }));
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!customRole.name.trim()) {
      toast('Özel rol ismi boş olamaz.', 'error');
      return;
    }
    if (customRole.permissions.length === 0) {
      toast('Özel rol için en az bir yetki seçmelisiniz.', 'error');
      return;
    }

    try {
      await rolesApi.createRole({
        name: customRole.name,
        description: "Özel tanımlı rol",
        permissions: customRole.permissions
      });
      toast('Rol başarıyla oluşturuldu!', 'success');
      setCustomRole({ name: '', permissions: [] });
      setActiveTab('existing');
      loadData();
    } catch (err) {
      toast('Rol oluşturulamadı: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  if (!canManageRoles) {
    return <div className="page-container"><p>Bu sayfayı görüntüleme yetkiniz yok.</p></div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Rol Yönetimi</h1>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            Mevcut Roller
          </button>
          <button
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Yeni Rol Oluştur
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'existing' && (
            <div className="table-container" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
              {loading ? (
                <p>Yükleniyor...</p>
              ) : roles.length === 0 ? (
                <p>Kayıtlı rol bulunamadı.</p>
              ) : (
                <div className="roles-grid">
                  {roles.map(r => (
                    <div key={r.id || r.name} className="role-card">
                      <div className="role-header">
                        <span className="role-title">{r.name}</span>
                        <span className="role-badge">{r.permissions?.length || 0} Yetki</span>
                      </div>
                      {r.description && <p className="role-desc">{r.description}</p>}
                      <div className="role-actions">
                        <button className="btn-icon view" title="Detay" onClick={() => openRoleModal(r, 'details')}>👁️</button>
                        <button className="btn-icon edit" title="Düzenle" onClick={() => openRoleModal(r, 'edit')}>✏️</button>
                        {r.name !== 'SuperAdmin' && (
                          <button className="btn-icon delete" title="Sil" onClick={() => handleDeleteRole(r.id || r.name)}>🗑️</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'new' && (
            <div className="create-role-card">
              <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Yeni Rol Oluştur</h2>
              <form onSubmit={handleCreateRole}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)' }}>Rol Adı <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: Sipariş Yöneticisi"
                    value={customRole.name}
                    onChange={e => setCustomRole({ ...customRole, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text-main)', marginBottom: '12px', display: 'block', fontWeight: 600 }}>Bu Rolün Yetkilerini Seçin</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', maxHeight: '300px', overflowY: 'auto', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {permissions.map((p, idx) => {
                      const permName = typeof p === 'string' ? p : (p.name || p.id);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-main)' }}>
                          <input
                            type="checkbox"
                            checked={customRole.permissions.includes(permName)}
                            onChange={() => {
                              setCustomRole(prev => ({
                                ...prev,
                                permissions: prev.permissions.includes(permName)
                                  ? prev.permissions.filter(x => x !== permName)
                                  : [...prev.permissions, permName]
                              }));
                            }}
                          />
                          {permName}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '24px', width: '100%', height: '48px', fontSize: '1.1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Rolü Kaydet
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Role Details/Edit Modal */}
      {showRoleModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRoleModal(false)}>✕</button>

            {showRoleModal === 'details' ? (
              <>
                <h2 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>{selectedRole.name}</h2>
                {selectedRole.description && <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{selectedRole.description}</p>}

                <h4 style={{ marginBottom: '12px' }}>Role Ait Yetkiler</h4>
                {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                  <div className="chips-container">
                    {selectedRole.permissions.map((p, idx) => (
                      <span key={idx} className="chip">{typeof p === 'string' ? p : p.name}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Bu role atanmış yetki yok.</p>
                )}
              </>
            ) : (
              <form onSubmit={handleUpdateRole}>
                <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Rolü Düzenle</h2>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Rol Adı</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editRoleData.name}
                    onChange={e => setEditRoleData({ ...editRoleData, name: e.target.value })}
                    disabled={selectedRole.name === 'SuperAdmin'}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Açıklama</label>
                  <textarea
                    className="form-control"
                    value={editRoleData.description}
                    onChange={e => setEditRoleData({ ...editRoleData, description: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                  />
                </div>

                <h4 style={{ marginBottom: '12px' }}>Yetkiler</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '250px', overflowY: 'auto', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                  {permissions.map((p, idx) => {
                    const permName = typeof p === 'string' ? p : (p.name || p.id);
                    return (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={editRoleData.permissions.includes(permName)}
                          onChange={() => handleRolePermToggle(permName)}
                        />
                        {permName}
                      </label>
                    );
                  })}
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Değişiklikleri Kaydet
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
