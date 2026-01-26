import { auth, signOut } from './firebase-config.js';
import { appendVotersData, getData } from './database.js';
let _domInitialized = false;

function toggleVisibility(elementClass, visible) {
    const element = document.querySelector(`.${elementClass}`);
    if (element) {
        element.classList.toggle('hidden', !visible);
        element.classList.toggle('visible', visible);
    }
}

async function initDOM() {
    if (_domInitialized && auth.currentUser) {
        toggleVisibility('logged-in-area', true);
        toggleVisibility('logged-out-area', false);
        return
    }
    if (!auth.currentUser) return;
    _domInitialized = true;
    document.body.setAttribute("oncontextmenu", "return false");
    toggleVisibility('logged-in-area', true);
    toggleVisibility('logged-out-area', false);
    const signOutButton = document.getElementById("logout-button");
    signOutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error', error);
        }
    });
    const data = await getData();
    appendVotersData(data);
}

function handleLoggout() {
    toggleVisibility('has-right-password', false);
    toggleVisibility('logged-in-area', false);
    toggleVisibility('logged-out-area', true);
}

const passwordVisible = document.getElementById('password-visible');
const passwordInput = document.getElementById('password-input');
const passwordDecorator = document.getElementById('password-input-decorator');
const passwordPlaceholder = document.querySelector('.password-placeholder');

function handlePassword() {
    document.addEventListener('input', (e) => {
        console.log('????')
        if (e.target && e.target.id === 'password-input') {
            toggleVisibility('password-placeholder', passwordInput.value.length === 0);
            if (passwordInput.value.length === 0) {
                passwordInput.style.top = '-32px'
                passwordDecorator.style.width = '0px';
                passwordVisible.textContent = '';
                return;
            }
            passwordInput.style.top = '0'
            passwordDecorator.style.width = `${passwordInput.value.length}ch`;
            console.log(e)
            passwordPlaceholder.classList.remove('password-error');
            passwordVisible.textContent = `Senha digitada: ${passwordInput.value}`;
        }
    })
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'password-input') {
            const password = passwordInput.value;
            const encodedPassword = btoa(password);
            if (encodedPassword === 'Y3Vkb2NhcmFpbw==') {
                toggleVisibility('has-right-password', true);
            } else {
                console.log("dsda")
                passwordPlaceholder.classList.add('password-error');
                passwordInput.value = '';
                toggleVisibility('has-right-password', false);
                passwordDecorator.style.width = '0px';
                passwordVisible.textContent = '';
                passwordInput.style.top = '-32px'
                toggleVisibility('password-placeholder', passwordInput.value.length === 0);
            }
        }
    })
}

handlePassword();

export { initDOM, handleLoggout, toggleVisibility };