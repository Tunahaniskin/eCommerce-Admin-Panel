import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { usersApi } from '../api/usersApi';
import { useUI } from '../../../shared/context/UIContext';
import Customer360Modal from '../components/Customer360Modal/Customer360Modal';
import './UsersPage.css';

const UsersPage = () => {
  const { toast, confirm } = useUI();
  const [activeTab, setActiveTab] = useState('existing'); // 'existing', 'roles', or 'new'
  const { hasPermission } = useAuth();
  const canManage = hasPermission('users.manage') || hasPermission('*');
  const canManageRoles = hasPermission('roles.manage') || hasPermission('*');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // New States
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [selectedEditRoleId, setSelectedEditRoleId] = useState('');

  const getInitials = (user) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return (user.email?.[0] || 'U').toUpperCase();
  };

  // Form State for New User
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', passwordConfirm: '', roleId: '' });

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Custom Role State
  const [roleMode, setRoleMode] = useState('standard'); // 'standard' or 'custom'
  const [customRole, setCustomRole] = useState({ name: '', permissions: [] });

  // State for Temp Permissions Inline Form
  const [permissions, setPermissions] = useState([]);
  const [tempPermUserId, setTempPermUserId] = useState(null);
  const [selectedTempPerms, setSelectedTempPerms] = useState([]);
  const [tempPermHours, setTempPermHours] = useState(24);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, permsData] = await Promise.allSettled([
        usersApi.getUsers(showDeleted),
        usersApi.getRoles(),
        usersApi.getPermissions()
      ]);

      if (usersData.status === 'fulfilled') {
        const uList = Array.isArray(usersData.value) ? usersData.value : (usersData.value?.items || []);
        setUsers(uList);
      }
      if (rolesData.status === 'fulfilled') {
        const rList = Array.isArray(rolesData.value) ? rolesData.value : [];
        setRoles(rList);
        if (rList.length > 0 && !newUser.roleId) {
          setNewUser(prev => ({ ...prev, roleId: rList[0].id || rList[0].name }));
        }
      }
      if (permsData.status === 'fulfilled') {
        const pList = Array.isArray(permsData.value) ? permsData.value : [];
        setPermissions(pList);
      }
    } catch (err) {
      console.error('Kullanıcı verileri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await usersApi.updateUserRole(userId, newRoleId);
      toast('Rol başarıyla güncellendi.', 'success');
      loadData();
    } catch (err) {
      toast('Rol güncellenemedi: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleSoftDelete = async (userId) => {
    confirm('Bu kullanıcıyı silmek (pasife almak) istediğinize emin misiniz?', async () => {
      try {
        await usersApi.deleteUser(userId);
        toast('Kullanıcı pasife alındı.', 'success');
        loadData();
      } catch (err) {
        toast('Silme işlemi başarısız: ' + (err.response?.data?.message || err.message), 'error');
      }
    });
  };

  const handleRestoreUser = async (userId) => {
    confirm('Bu kullanıcıyı tekrar aktif hale getirmek istediğinize emin misiniz?', async () => {
      try {
        await usersApi.restoreUser(userId);
        toast('Kullanıcı aktif edildi.', 'success');
        loadData();
      } catch (err) {
        toast('Geri yükleme işlemi başarısız: ' + (err.response?.data?.message || err.message), 'error');
      }
    });
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };



  const toggleTempPermPanel = (userId) => {
    if (tempPermUserId === userId) {
      setTempPermUserId(null); // Kapat
      setSelectedTempPerms([]);
    } else {
      setTempPermUserId(userId); // Aç
      setSelectedTempPerms([]);
      setTempPermHours(24);
    }
  };

  const handleTempPermToggleCheck = (permString) => {
    setSelectedTempPerms(prev =>
      prev.includes(permString)
        ? prev.filter(p => p !== permString)
        : [...prev, permString]
    );
  };

  const handleSaveTempPermissions = async (userId) => {
    if (selectedTempPerms.length === 0) {
      toast('Lütfen en az bir yetki seçin.', 'error');
      return;
    }

    try {
      // Backend'deki endpoint tek bir permission alacak şekilde tasarlanmış olabilir
      // Bu yüzden her bir yetki için promise gönderiyoruz.
      const promises = selectedTempPerms.map(perm =>
        usersApi.grantTemporaryPermission(userId, perm, parseInt(tempPermHours, 10))
      );

      await Promise.all(promises);
      toast(`${selectedTempPerms.length} adet geçici yetki başarıyla atandı.`, 'success');
      setTempPermUserId(null);
      setSelectedTempPerms([]);
      loadData();
    } catch (err) {
      toast('Geçici yetkiler atanırken bir hata oluştu: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
      toast("Ad ve soyad alanları boş olamaz.", 'error');
      return;
    }

    if (newUser.password !== newUser.passwordConfirm) {
      toast("Şifreler uyuşmuyor. Lütfen kontrol edin.", 'error');
      return;
    }

    try {
      let finalRoleId = newUser.roleId;

      if (roleMode === 'custom') {
        if (!customRole.name.trim()) {
          toast('Özel rol ismi boş olamaz.', 'error');
          return;
        }
        if (customRole.permissions.length === 0) {
          toast('Özel rol için en az bir yetki seçmelisiniz.', 'error');
          return;
        }

        // Rol oluştur
        const roleResponse = await usersApi.createRole({
          name: customRole.name,
          description: "Özel tanımlı rol",
          permissions: customRole.permissions
        });

        finalRoleId = roleResponse.roleId || roleResponse.id || customRole.name;
      }

      await usersApi.createUser({ ...newUser, roleId: finalRoleId });
      toast(`${newUser.firstName} ${newUser.lastName} başarıyla oluşturuldu!`, 'success');
      setNewUser({ firstName: '', lastName: '', email: '', password: '', passwordConfirm: '', roleId: roles[0]?.id || '' });
      setCustomRole({ name: '', permissions: [] });
      setRoleMode('standard');
      setActiveTab('existing');
      loadData();
    } catch (err) {
      toast('Kullanıcı oluşturulamadı: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const roleName = (u.role?.name || u.roleId || u.role || '').toString().toLowerCase();
    return fullName.includes(term) || email.includes(term) || roleName.includes(term);
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Users Management</h1>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            Mevcut Kullanıcı İşlemleri
          </button>

          {canManage && (
            <button
              className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              Yeni Kullanıcı İşlemleri
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'existing' && (
            <div className="users-table-card">
              {/* Modern Toolbar */}
              <div className="users-toolbar">
                <div className="users-search-box">
                  <span className="users-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="İsim, e-posta veya rol ile filtrele..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="users-search-input"
                  />
                  {searchTerm && (
                    <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Aramayı Temizle">✕</button>
                  )}
                </div>

                <div className="users-toolbar-actions">
                  <div className="users-count-badge">
                    👥 Toplam <strong>{filteredUsers.length}</strong> Kullanıcı
                  </div>

                  <label className="toggle-deleted-label">
                    <label className="switch" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span>Silinmişleri Göster</span>
                  </label>

                  <button 
                    className="btn-refresh-icon" 
                    title="Yenile" 
                    onClick={loadData} 
                    disabled={loading}
                  >
                    <span className={loading ? 'spinning' : ''}>🔄</span>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38%' }}>KULLANICI</th>
                      <th style={{ width: '22%' }}>ROL</th>
                      <th style={{ width: '15%' }}>DURUM</th>
                      <th style={{ width: '25%', textAlign: 'right' }}>İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '50px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                            <span className="spinning" style={{ fontSize: '1.2rem' }}>🔄</span> Yükleniyor...
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                          {searchTerm ? 'Arama kriterlerine uygun kullanıcı bulunamadı.' : 'Kullanıcı bulunamadı.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <React.Fragment key={u.id}>
                          <tr 
                            className="hover-row"
                            style={{ 
                              opacity: u.isDeleted ? 0.65 : 1, 
                              background: u.isDeleted ? 'rgba(244, 247, 254, 0.4)' : 'inherit' 
                            }}
                          >
                            <td>
                              <div className="user-cell">
                                <div className={`user-avatar-circle ${u.isDeleted ? 'deleted' : ''}`}>
                                  {getInitials(u)}
                                </div>
                                <div className="user-info-text">
                                  <span className="user-name-title" style={{ textDecoration: u.isDeleted ? 'line-through' : 'none' }}>
                                    {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'İsimsiz Kullanıcı'}
                                  </span>
                                  <span className="user-email-subtitle">✉️ {u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {editingRoleUserId === u.id ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <select
                                    className="users-role-select"
                                    value={selectedEditRoleId}
                                    onChange={(e) => setSelectedEditRoleId(e.target.value)}
                                  >
                                    {roles.map(r => (
                                      <option key={r.id || r.name} value={r.id || r.name}>
                                        {r.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button className="btn-icon" style={{ color: 'var(--success)' }} title="Kaydet" onClick={() => { handleRoleChange(u.id, selectedEditRoleId); setEditingRoleUserId(null); }}>✔️</button>
                                  <button className="btn-icon" style={{ color: 'var(--danger)' }} title="İptal" onClick={() => setEditingRoleUserId(null)}>❌</button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span className="role-badge">
                                    {u.role?.name || u.role || 'Bilinmiyor'}
                                  </span>
                                  {canManageRoles && !u.isDeleted && (
                                    <button className="btn-edit-role" title="Rolü Düzenle" onClick={() => { setEditingRoleUserId(u.id); setSelectedEditRoleId(u.role?.id || u.roleId || u.role?.name || ''); }}>✏️</button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`user-status-pill ${u.isDeleted ? 'deleted' : 'active'}`}>
                                <span className="status-dot"></span>
                                {u.isDeleted ? 'Silinmiş' : 'Aktif'}
                              </span>
                            </td>
                            <td>
                              <div className="user-action-buttons" style={{ justifyContent: 'flex-end' }}>
                                <button 
                                  className="btn-inspect" 
                                  title="360° Müşteri Kartı ve Detaylar" 
                                  onClick={() => openUserDetails(u)}
                                >
                                  <span>👁️</span>
                                  <span>Detay 360°</span>
                                </button>
                                
                                {!u.isDeleted ? (
                                  <>
                                    {canManageRoles && (
                                      <button 
                                        className="btn-perm-sm" 
                                        title="Geçici Yetki Tanımla" 
                                        onClick={() => toggleTempPermPanel(u.id)}
                                      >
                                        <span>🛡️</span>
                                        <span>+ Geçici Yetki</span>
                                      </button>
                                    )}
                                    {canManage && (
                                      <button 
                                        className="btn-delete-sm" 
                                        title="Kullanıcıyı Sil (Pasife Al)" 
                                        onClick={() => handleSoftDelete(u.id)}
                                      >
                                        <span>🗑️</span>
                                        <span>Sil</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  canManage && (
                                    <button 
                                      className="btn-restore-sm" 
                                      title="Kullanıcıyı Aktifleştir" 
                                      onClick={() => handleRestoreUser(u.id)}
                                    >
                                      <span>🔄</span>
                                      <span>Geri Yükle</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Temporary Permissions Row */}
                          {tempPermUserId === u.id && (
                            <tr>
                              <td colSpan="4" style={{ padding: '0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                                <div className="temp-perm-panel" style={{ padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Geçici Yetki Ekle - {u.firstName || u.email}</h3>
                                    <button className="btn-icon" onClick={() => setTempPermUserId(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
                                  </div>

                                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Yetkiler (Birden fazla seçilebilir)</label>
                                      <div className="permissions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                        {permissions.length === 0 ? (
                                          <p style={{ color: 'var(--text-muted)' }}>Sistemde kayıtlı yetki bulunamadı.</p>
                                        ) : (
                                          permissions.map((p, idx) => {
                                            const permName = typeof p === 'string' ? p : (p.name || p.id);
                                            return (
                                              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                <input
                                                  type="checkbox"
                                                  checked={selectedTempPerms.includes(permName)}
                                                  onChange={() => handleTempPermToggleCheck(permName)}
                                                />
                                                <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{permName}</span>
                                              </label>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>

                                    <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)' }}>Geçerlilik Süresi (Saat)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="720"
                                        value={tempPermHours}
                                        onChange={(e) => setTempPermHours(e.target.value)}
                                        className="form-control"
                                        style={{ width: '100%' }}
                                      />

                                      <button
                                        className="btn-primary"
                                        style={{ width: '100%', marginTop: 'auto' }}
                                        onClick={() => handleSaveTempPermissions(tempPermUserId)}
                                      >
                                        Seçili Yetkileri Ata
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {activeTab === 'new' && canManage && (
            <div className="add-user-card">
              <h2 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Yeni Kullanıcı Oluştur</h2>
              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Ad <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.firstName}
                      onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Soyad <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.lastName}
                      onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Adresi <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Şifre <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                        onMouseLeave={() => setShowPassword(false)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                        }}
                        title="Basılı tutarak şifreyi görebilirsiniz"
                      >
                        👁️
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Şifre Tekrar <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswordConfirm ? "text" : "password"}
                        className="form-control"
                        value={newUser.passwordConfirm}
                        onChange={e => setNewUser({ ...newUser, passwordConfirm: e.target.value })}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => setShowPasswordConfirm(true)}
                        onMouseUp={() => setShowPasswordConfirm(false)}
                        onMouseLeave={() => setShowPasswordConfirm(false)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                        }}
                        title="Basılı tutarak şifreyi görebilirsiniz"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'block', color: 'var(--text-main)' }}>Rol & Yetkilendirme</label>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setRoleMode('standard')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                        background: roleMode === 'standard' ? 'var(--primary)' : 'var(--bg-main)',
                        color: roleMode === 'standard' ? 'white' : 'var(--text-main)',
                        border: roleMode === 'standard' ? '1px solid var(--primary)' : '1px solid var(--border)'
                      }}
                    >
                      Hazır Rol Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleMode('custom')}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                        background: roleMode === 'custom' ? '#8b5cf6' : 'var(--bg-main)',
                        color: roleMode === 'custom' ? 'white' : 'var(--text-main)',
                        border: roleMode === 'custom' ? '1px solid #8b5cf6' : '1px solid var(--border)'
                      }}
                    >
                      Özel Rol (Custom) Oluştur
                    </button>
                  </div>

                  {roleMode === 'standard' ? (
                    <div>
                      <label style={{ color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Mevcut Roller</label>
                      <select
                        className="form-control"
                        value={newUser.roleId}
                        onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                      >
                        {roles.map(r => (
                          <option key={r.id || r.name} value={r.id || r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px dashed #8b5cf6' }}>
                      <div className="form-group">
                        <label style={{ color: '#8b5cf6' }}>Özel Rol Adı <span style={{ color: 'red' }}>*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Örn: Sipariş Yöneticisi"
                          value={customRole.name}
                          onChange={e => setCustomRole({ ...customRole, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ color: 'var(--text-main)', marginBottom: '12px', display: 'block' }}>Bu Rolün Yetkilerini Seçin</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          {permissions.map((p, idx) => {
                            const permName = typeof p === 'string' ? p : (p.name || p.id);
                            return (
                              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
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
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '24px', width: '100%', height: '48px', fontSize: '1.1rem' }}>
                  Kullanıcıyı {roleMode === 'custom' ? 've Özel Rolü ' : ''}Kaydet
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* User 360 Modal */}
      {showUserModal && selectedUser && (
        <Customer360Modal 
          userId={selectedUser.id} 
          onClose={() => setShowUserModal(false)} 
        />
      )}


    </div>
  );
};

export default UsersPage;
