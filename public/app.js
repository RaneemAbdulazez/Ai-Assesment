const storageKey = 'ai-compass-assessment';

const appState = {
  company: {
    companyName: '',
    industry: '',
    industryOther: '',
    teamSize: '',
    yearsInOperation: '',
    products: '',
    departments: [],
    customerType: '',
    businessGoals: [],
    challenges: '',
    decisionMaker: '',
    email: '',
  },
};

const form = document.getElementById('company-overview-form');
const departmentNameInput = document.getElementById('department-name-input');
const departmentList = document.getElementById('department-list');
const phase1Status = document.getElementById('phase1-status');
const toast = document.getElementById('toast');

restoreFromStorage();
renderDepartmentList();
restoreFormValues();

const industryRadios = form.querySelectorAll('input[name="industry"]');
const otherIndustryField = form.industryOther;

industryRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    toggleOtherIndustry(radio.value === 'Other');
  });
});

toggleOtherIndustry(form.querySelector('input[name="industry"]:checked')?.value === 'Other');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const valid = form.reportValidity();
  if (!valid) {
    showToast('Please complete the required fields before saving.', 'error');
    return;
  }

  const formData = new FormData(form);
  const businessGoals = formData.getAll('businessGoals');
  const companyData = {
    companyName: formData.get('companyName')?.trim() ?? '',
    industry: formData.get('industry') ?? '',
    industryOther:
      formData.get('industry') === 'Other' ? formData.get('industryOther')?.trim() ?? '' : '',
    teamSize: formData.get('teamSize') ?? '',
    yearsInOperation: formData.get('yearsInOperation') ?? '',
    products: formData.get('products')?.trim() ?? '',
    departments: [...appState.company.departments],
    customerType: formData.get('customerType') ?? '',
    businessGoals,
    challenges: formData.get('challenges')?.trim() ?? '',
    decisionMaker: formData.get('decisionMaker')?.trim() ?? '',
    email: formData.get('email')?.trim() ?? '',
  };

  appState.company = companyData;
  persistToStorage();
  phase1Status.textContent = 'Company overview saved successfully.';
  showToast('Phase 1 information saved. Phase 2 will unlock in the next stage.', 'success');
  unlockPhase('phase2');
});

document.getElementById('add-department-btn').addEventListener('click', () => {
  departmentNameInput.focus();
});

document.getElementById('save-department-btn').addEventListener('click', () => {
  const name = departmentNameInput.value.trim();
  if (!name) {
    showToast('Please enter a department name before saving.', 'error');
    return;
  }

  if (appState.company.departments.includes(name)) {
    showToast('This department has already been added.', 'error');
    departmentNameInput.focus();
    return;
  }

  appState.company.departments.push(name);
  departmentNameInput.value = '';
  renderDepartmentList();
  persistToStorage();
  showToast(`Department “${name}” added.`, 'success');
});

function renderDepartmentList() {
  departmentList.innerHTML = '';
  const template = document.getElementById('department-item-template');

  appState.company.departments.forEach((department) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.department-card__title').textContent = department;
    node
      .querySelector('.icon-button.remove')
      .addEventListener('click', () => removeDepartment(department));
    departmentList.appendChild(node);
  });

  departmentList.parentElement.dataset.hasDepartments = String(
    appState.company.departments.length > 0,
  );
}

function removeDepartment(name) {
  appState.company.departments = appState.company.departments.filter(
    (department) => department !== name,
  );
  renderDepartmentList();
  persistToStorage();
  showToast(`Removed ${name} from departments.`, 'success');
}

function persistToStorage() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(appState));
  } catch (error) {
    console.error('Failed to persist assessment state', error);
  }
}

function restoreFromStorage() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.company) {
      appState.company = {
        ...appState.company,
        ...parsed.company,
        departments: Array.isArray(parsed.company.departments)
          ? parsed.company.departments
          : [],
        businessGoals: Array.isArray(parsed.company.businessGoals)
          ? parsed.company.businessGoals
          : [],
      };
    }
  } catch (error) {
    console.error('Failed to parse saved assessment state', error);
  }
}

function restoreFormValues() {
  const { company } = appState;
  form.companyName.value = company.companyName ?? '';
  if (company.industry) {
    const radio = form.querySelector(`input[name="industry"][value="${CSS.escape(company.industry)}"]`);
    if (radio) radio.checked = true;
    toggleOtherIndustry(company.industry === 'Other');
    if (company.industry === 'Other') {
      form.industryOther.value = company.industryOther ?? '';
    }
  }

  if (company.teamSize) {
    const radio = form.querySelector(`input[name="teamSize"][value="${CSS.escape(company.teamSize)}"]`);
    if (radio) radio.checked = true;
  }

  if (company.yearsInOperation) {
    const radio = form.querySelector(
      `input[name="yearsInOperation"][value="${CSS.escape(company.yearsInOperation)}"]`,
    );
    if (radio) radio.checked = true;
  }

  form.products.value = company.products ?? '';
  form.customerType.value = company.customerType ?? '';
  form.challenges.value = company.challenges ?? '';
  form.decisionMaker.value = company.decisionMaker ?? '';
  form.email.value = company.email ?? '';

  if (Array.isArray(company.businessGoals)) {
    form.querySelectorAll('input[name="businessGoals"]').forEach((checkbox) => {
      checkbox.checked = company.businessGoals.includes(checkbox.value);
    });
  }

  if (appState.company.departments.length) {
    unlockPhase('phase2');
  }
}

function unlockPhase(phaseId) {
  const pill = document.querySelector(`.phase-pill[data-phase="${phaseId}"]`);
  if (pill) {
    pill.disabled = false;
    pill.classList.add('active');
  }

  const phaseSection = document.getElementById(phaseId);
  if (phaseSection) {
    phaseSection.hidden = false;
    phaseSection.classList.add('active');
  }
}

function showToast(message, variant = 'success') {
  toast.textContent = message;
  toast.className = `toast ${variant}`;
  toast.hidden = false;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

window.addEventListener('beforeunload', persistToStorage);

function toggleOtherIndustry(show) {
  if (!otherIndustryField) return;
  otherIndustryField.toggleAttribute('required', Boolean(show));
  otherIndustryField.closest('.other-industry').classList.toggle('visible', Boolean(show));
  if (!show) {
    otherIndustryField.value = '';
  } else {
    otherIndustryField.focus();
  }
}
