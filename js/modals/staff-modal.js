// ===========================
// 職員関連モーダル
// ===========================

let editingStaffId = null;

function openStaffModal(staffId) {
  editingStaffId = staffId || null;
  const modal = document.getElementById('staff-create-modal');

  document.getElementById('new-staff-deptId').innerHTML = '<option value="">選択してください</option>' +
    MOCK_DATA.departments.filter(d => d.status === 1)
      .map(d => `<option value="${d.deptId}">${d.deptName}</option>`).join('');

  const modalTitle = modal.querySelector('.modal-header h3');
  if (modalTitle) modalTitle.textContent = editingStaffId ? '職員情報編集' : '新規職員登録';

  const staffFields = {
    'new-staff-lastName': '', 'new-staff-firstName': '',
    'new-staff-lastNameKana': '', 'new-staff-firstNameKana': '',
    'new-staff-email': '', 'new-staff-tel': '', 'new-staff-mobile': '',
    'new-staff-position': '', 'new-staff-employmentType': '正社員',
    'new-staff-joinDate': '', 'new-staff-role': 'member',
    'new-staff-staffFlag': '税務', 'new-staff-memo': '', 'new-staff-deptId': '',
    'new-staff-cwAccountId': '', 'new-staff-photoUrl': '',
    'new-staff-libeProfileUrl': '', 'new-staff-selfIntro': '',
  };

  if (editingStaffId) {
    const u = getUserById(editingStaffId);
    if (u) {
      setFormValues({
        'new-staff-lastName': u.lastName, 'new-staff-firstName': u.firstName,
        'new-staff-lastNameKana': u.lastNameKana, 'new-staff-firstNameKana': u.firstNameKana,
        'new-staff-email': u.email, 'new-staff-tel': u.tel, 'new-staff-mobile': u.mobile,
        'new-staff-position': u.position, 'new-staff-employmentType': u.employmentType || '正社員',
        'new-staff-joinDate': u.joinDate, 'new-staff-role': u.role || 'member',
        'new-staff-staffFlag': u.staffFlag || '税務', 'new-staff-memo': u.memo,
        'new-staff-deptId': u.deptId || '',
        'new-staff-cwAccountId': u.cwAccountId || '',
        'new-staff-photoUrl': u.photoUrl || '',
        'new-staff-libeProfileUrl': u.libeProfileUrl || '',
        'new-staff-selfIntro': u.selfIntro || '',
      });
    }
  } else {
    setFormValues(staffFields);
  }

  showModal('staff-create-modal');
}

function submitNewStaff() {
  const lastName = getValTrim('new-staff-lastName');
  const firstName = getValTrim('new-staff-firstName');
  const lastNameKana = getValTrim('new-staff-lastNameKana');
  const firstNameKana = getValTrim('new-staff-firstNameKana');
  const email = getValTrim('new-staff-email');
  const tel = getValTrim('new-staff-tel');
  const mobile = getValTrim('new-staff-mobile');
  const deptIdVal = getVal('new-staff-deptId');
  const deptId = deptIdVal ? parseInt(deptIdVal) : null;
  const position = getValTrim('new-staff-position');
  const employmentType = getVal('new-staff-employmentType');
  const joinDate = getVal('new-staff-joinDate');
  const role = getVal('new-staff-role');
  const staffFlag = getVal('new-staff-staffFlag');
  const memo = getValTrim('new-staff-memo');
  const cwAccountId = getValTrim('new-staff-cwAccountId');
  const photoUrl = getValTrim('new-staff-photoUrl');
  const libeProfileUrl = getValTrim('new-staff-libeProfileUrl');
  const selfIntro = getValTrim('new-staff-selfIntro');

  if (!lastName) { alert('姓を入力してください'); return; }
  if (!email) { alert('メールアドレスを入力してください'); return; }

  const name = firstName ? lastName + ' ' + firstName : lastName;

  if (editingStaffId) {
    const u = getUserById(editingStaffId);
    if (u) {
      Object.assign(u, { lastName, firstName, lastNameKana, firstNameKana,
        name, email, tel, mobile, deptId, position, employmentType,
        joinDate, role, staffFlag, memo, cwAccountId, photoUrl, libeProfileUrl, selfIntro, loginId: email.split('@')[0] });
    }
    hideModal('staff-create-modal');
    navigateTo('staff-detail', { id: editingStaffId });
    editingStaffId = null;
  } else {
    let maxCode = 0;
    MOCK_DATA.users.forEach(function(u) {
      if (u.staffCode && u.staffCode.startsWith('A')) {
        var num = parseInt(u.staffCode.slice(1), 10);
        if (num > maxCode) maxCode = num;
      }
    });
    const nextCode = 'A' + String(maxCode + 1).padStart(3, '0');
    const newId = generateId('u-', MOCK_DATA.users);

    MOCK_DATA.users.push({
      id: newId, staffCode: nextCode, lastName, firstName,
      lastNameKana, firstNameKana, name, email, tel, mobile,
      role, deptId, team: null, position, employmentType,
      joinDate, memo, cwAccountId, photoUrl, libeProfileUrl, selfIntro, loginId: email.split('@')[0], isActive: true,
      baseRatio: null, staffFlag,
    });

    hideModal('staff-create-modal');
    if (currentPage === 'staff') navigateTo('staff');
    else alert(`職員「${name}」を登録しました`);
  }
}
