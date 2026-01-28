import { database, auth } from './firebase-config.js';
import { ref, set, get, getDatabase, onValue } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';
import { toggleVisibility } from './script.js';

let dbRef;
window.addEventListener('DOMContentLoaded', () => {
    if (window.firebaseui && window.firebase) {
        console.log('Firebase initialized');
    document.getElementById("issueInputForm").addEventListener("submit", saveIssue);
const db = getDatabase();
dbRef = ref(db, 'age/');
const unsubscribe = onValue(dbRef, snapshot => {
    const data = snapshot.exists() ? snapshot.val() : {};
    appendVotersData(data);
});
    } else {
        console.warn('Firebase not initialized yet');
    }
});



function removeVoteFromList(id) {
    const voteContainer = document.querySelector(`img[id="${id}"]`);
    if (voteContainer) {
        voteContainer.remove();
    }
}

async function appendVotersModal() {
    const data = await getData();
    const ageValues = Object.keys(data);
    ageValues.forEach((value) => {
        const ageDiv = document.getElementById(`age-group-section-${value}`);
    Object.values(data[value]).forEach(entry => {
        if (document.querySelector(`#${entry.uid}-grouped`)) {
            document.querySelector(`#${entry.uid}-grouped`).remove();
        }
        const img = document.createElement('img');
        const name = document.createElement('span');
        name.textContent = entry.displayName || 'Voter';
        img.style.position = 'relative';
        img.src = entry.photURL;
        img.alt = entry.displayName || 'Voter';
        img.title = entry.displayName || 'Voter';
        img.id = entry.photURL + 'modal';
        const grouped = document.createElement('div');
        grouped.id = entry.uid + '-grouped';
        grouped.appendChild(img);
        grouped.appendChild(name);
        ageDiv.appendChild(grouped);
        handleVotersStyle(entry.photURL + 'modal');
        
    })
    });
}

function appendVotersData(data) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const uid = currentUser.uid
    const ageValues = Object.keys(data);
    ageValues.forEach(value => {
        const votersContainer = document.getElementById(`${value}-voters`);
        const totalVotesParagraph = votersContainer.querySelector('.total-votes');
        const imgContainer = votersContainer.querySelector('.img-container');
        totalVotesParagraph.textContent = `Total: ${Object.keys(data[value] || {}).length}`;
        if (data[value] && data[value][uid]) {
            const input = document.querySelector(`input[name="age"][value="${value}"]`);
            if (input) {
                input.checked = true;
            }
        }
        Object.values(data[value]).forEach((entry, index) => {
            if (document.getElementById(entry.photURL)) {
                document.getElementById(entry.photURL).remove();
            }
            const img = document.createElement('img');
            img.style.position = 'relative';
            img.src = entry.photURL;
            img.alt = entry.displayName || 'Voter';
            img.title = entry.displayName || 'Voter';
            imgContainer.appendChild(img);
            imgContainer.lastElementChild.id = entry.photURL;
            handleVotersStyle(entry.photURL);
        })
    })
}

function handleVotersStyle(imgId) {
    const img = document.getElementById(imgId);
    if (img) {
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.borderRadius = '50%';
        img.style.margin = '2px';
    }
}

async function getData() {
    return get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            return data;
        } else {
            return {};
        }
    }).catch((error) => {
        toggleVisibility('error-modal', true);
        console.error(error);
        return {};
    });
}

const hasUserVotedInAnotherAge = (data, uid) => {
    if (!uid) return [];
    return Object.values(data).filter(entry => entry && entry[uid]);
}

function removePreviousVote(value, uid) {
    set(ref(database, "age/" + value + "/" + uid), null)
        .then(() => console.log('Previous vote removed'))
        .catch(err => {
            console.error('Failed to remove previous vote', err)
            toggleVisibility('error-modal', true);
});
}

function handleModalSubmit() {
    const modal = document.getElementById("submitModal");
    const isModalVisible = modal.checkVisibility();
    toggleVisibility("submit-modal", !isModalVisible);
}


async function saveIssue(e) {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const uid = currentUser.uid;
    const displayName = currentUser.displayName || null;
    const photURL = currentUser.photoURL || null;
    const value = document.querySelector('input[name="age"]:checked').value;

    const data = await getData();
    const previousUserVote = hasUserVotedInAnotherAge(data, uid);
    if (previousUserVote.length > 0) {
        previousUserVote.forEach(entry => {
            const ageGroup = entry[uid].value;
            removePreviousVote(ageGroup, uid);
            removeVoteFromList(uid);
        });
    }

    set(ref(database, "age/" + value + "/" + uid), {
        displayName,
        photURL,
        value,
        uid,
    })
        .then(async () => {
            handleModalSubmit();
            const data = await getData();
            appendVotersData(data);
            setTimeout(() => {
                handleModalSubmit();
            }, 3000)
        })
        .catch(err => {
            console.error('Save failed', err)
            toggleVisibility('error-modal', true);
});
}

function openModal(modalClass) {
    document.body.style.overflow = 'hidden';
        appendVotersModal();
        toggleVisibility(modalClass, true);
}

function closeVotersModal(modalClass) {
    document.body.style.overflow = 'auto';
    toggleVisibility(modalClass, false);
}

window.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'seeMoreAge') {
        openModal('voters-modal');
        return;
    }
    if (e.target && e.target.id === 'closeSeeMoreAge') {
        closeVotersModal('voters-modal');
        return;
    }
    if (e.target && e.target.id === 'closeErrorModal') {
        closeVotersModal('error-modal');
        return;
    }
})

export { appendVotersData, getData };

// Call initDOM whenever auth state becomes signed-in. This avoids relying on
// other modules to call it and prevents circular import issues.
