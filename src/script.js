import { auth, signOut } from './firebase-config.js';
import { appendVotersData, getData } from './database.js';
import { loginWithGoogle } from './firebase-config.js';

const loginBtn = document.getElementById('login-button');
loginBtn.addEventListener('click', () => {
  loginWithGoogle();
});

function toggleVisibility(elementClass, visible) {
    const element = document.querySelector(`.${elementClass}`);
    if (element) {
        element.classList.toggle('hidden', !visible);
        element.classList.toggle('visible', visible);
    }
}

async function initDOM() {
    if (auth.currentUser) {
        toggleVisibility('logged-in-area', true);
        toggleVisibility('logged-out-area', false);
    }
    if (!auth.currentUser) {
        toggleVisibility('logged-in-area', false);
        toggleVisibility('logged-out-area', true);
        return
    }
    document.body.setAttribute("oncontextmenu", "return false");
    // toggleVisibility('logged-in-area', true);
    toggleVisibility('logged-out-area', false);
    const signOutButton = document.getElementById("logout-button");
    signOutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            handleLoggout();
        } catch (error) {
            console.error('Sign out error', error);
        }
    });
    // const data = await getData();
    // appendVotersData(data);
}

function handleLoggout() {
    resetPasswordInput();
    toggleVisibility('has-right-password', false);
    toggleVisibility('logged-in-area', false);
    toggleVisibility('logged-out-area', true);
}

const passwordVisible = document.getElementById('password-visible');
const passwordInput = document.getElementById('password-input');
const passwordDecorator = document.getElementById('password-input-decorator');
const passwordPlaceholder = document.querySelector('.password-placeholder');

function resetPasswordInput() {
    toggleVisibility('btn-submit-pw', false)
    passwordInput.value = '';
    passwordInput.style.top = '-32px'
    passwordDecorator.style.width = '0px';
    passwordVisible.textContent = '';
    toggleVisibility('password-placeholder', passwordInput.value.length === 0);
    toggleVisibility('has-right-password', false);
}

function validatePassword() {
    const encodedPassword = btoa(passwordInput.value);
    if (encodedPassword === 'Y3Vkb2NhcmFpbw==') {
        toggleVisibility('has-right-password', true);
    } else {
        passwordPlaceholder.classList.add('password-error');
        resetPasswordInput();
    }
}

function resetPasswordInputStatus() {
    passwordInput.style.top = '0'
    passwordPlaceholder.classList.remove('password-error');
}

function handlePassword() {
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-submit-pw') {
            validatePassword();
        }
    });
    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'password-input') {
            toggleVisibility('password-placeholder', passwordInput.value.length === 0);
            if (passwordInput.value.length === 0) {
                toggleVisibility('btn-submit-pw', false)
                resetPasswordInput();
                return;
            }
            resetPasswordInputStatus();
            toggleVisibility('btn-submit-pw', true)
            passwordDecorator.style.width = `${passwordInput.value.length}ch`;

            passwordVisible.textContent = `Senha digitada: ${passwordInput.value}`;
        }
    })
}

function handleView() {
    const mobileOnlySection = document.querySelector('.only-for-mobile');
    const mainContent = document.querySelector('.mobile-section');
    if (window.innerWidth > 768) {
        mobileOnlySection.style.display = 'flex';
        toggleVisibility('only-for-mobile', true);
        mainContent.innerHTML = '';
    } else {
        toggleVisibility('only-for-mobile', false);
        toggleVisibility('mobile-section', true);
    }
}

handlePassword();
handleView();

export { initDOM, handleLoggout, toggleVisibility };