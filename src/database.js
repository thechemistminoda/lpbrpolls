import { database, auth } from './firebase-config.js';
import { ref, set, get, getDatabase, onValue } from 'firebase/database';
import { toggleVisibility, initDOM } from './script.js';

let dbIdade;
let dbSO;
let formMap;
window.addEventListener('DOMContentLoaded', async () => {
        await initDOM();
        document.getElementById("ageForm").addEventListener("submit", saveIssue);
        document.getElementById("soForm").addEventListener("submit", saveIssue);
        const db = getDatabase();
        dbIdade = ref(db, 'age/');
        dbSO = ref(db, 'so/');
        formMap = {
            id: {
                ageForm: 'age',
                soForm: 'so',
            },
            inputName: {
                ageForm: 'age',
                soForm: 'orientacao',
            },
            dbRef: {
                ageForm: dbIdade,
                soForm: dbSO,
            }   
        }
        const unsubscribeDbIdade = onValue(dbIdade, snapshot => {
            const data = snapshot.exists() ? snapshot.val() : {};
            appendVotersData(data, "age", "age");
            appendVotersModal(data, "age", "age");
        });
        const unsubscribeDbSO = onValue(dbSO, snapshot => {
            const data = snapshot.exists() ? snapshot.val() : {};
            appendVotersData(data, "orientacao", "so");
            appendVotersModal(data, "orientacao", "so");
        });
});


function removeVoteFromList(id) {
    const voteContainer = document.querySelector(`img[id="${id}"]`);
    if (voteContainer) {
        voteContainer.remove();
    }
}

async function appendVotersModal(idPrefix) {
    const dbRef = formMap.dbRef[idPrefix + 'Form'];
    if (!dbRef) return;
    const data = await getData(dbRef);
    const ageValues = Object.keys(data);
    ageValues.forEach((value) => {
        const valueDiv = document.getElementById(`${idPrefix}-group-section-${value}`);
        Object.values(data[value]).forEach(entry => {
            if (document.getElementById(`#${idPrefix}${entry.uid}-grouped`)) {
                document.getElementById(`#${idPrefix}${entry.uid}-grouped`).remove();
            }
            const img = document.createElement('img');
            const name = document.createElement('span');
            name.textContent = entry.displayName || 'Voter';
            img.style.position = 'relative';
            img.src = entry.photURL;
            img.alt = entry.displayName || 'Voter';
            img.title = entry.displayName || 'Voter';
            img.id = idPrefix + entry.photURL + 'modal';
            const grouped = document.createElement('div');
            grouped.id = idPrefix + entry.uid + '-grouped';
            grouped.appendChild(img);
            grouped.appendChild(name);
            valueDiv.appendChild(grouped);
            const voterId = `${idPrefix}${entry.photURL}`;
            handleVotersStyle(voterId + 'modal');

        })
    });
}

function appendVotersData(data, inputName, idPrefix) {
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
            const input = document.querySelector(`input[name="${inputName}"][value="${value}"]`);
            if (input) {
                input.checked = true;
            }
        }
        Object.values(data[value]).forEach(entry => {
            const voterId = `${idPrefix}${entry.photURL}`;
            if (document.getElementById(voterId)) {
                document.getElementById(voterId).remove();
            }
            const img = document.createElement('img');
            img.style.position = 'relative';
            img.src = entry.photURL;
            img.alt = entry.displayName || 'Voter';
            img.title = entry.displayName || 'Voter';
            imgContainer.appendChild(img);
            imgContainer.lastElementChild.id = voterId;
            handleVotersStyle(voterId);
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

async function getData(dbRef) {
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

const hasUserVotedInAnotherInput = (data, uid) => {
    if (!uid) return [];
    return Object.values(data).filter(entry => entry && entry[uid]);
}

function removePreviousVote(db, value, uid) {
    set(ref(database, db + "/" + value + "/" + uid), null)
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
    const dbName = formMap.id[e.target.id];
    const inputName = formMap.inputName[e.target.id];
    const dbRef = formMap.dbRef[e.target.id];
    const uid = currentUser.uid;
    const displayName = currentUser.displayName || null;
    const photURL = currentUser.photoURL || null;
    const voterId = `${dbName}${photURL}`;
    const value = document.querySelector(`input[name="${inputName}"]:checked`).value;
    const data = await getData(dbRef);
    const previousUserVote = hasUserVotedInAnotherInput(data, uid);
    if (previousUserVote.length > 0) {
        previousUserVote.forEach(entry => {
            const voteValue = entry[uid].value;
            removePreviousVote(dbName, voteValue, uid);
            removeVoteFromList(voterId);
        });
    }

    set(ref(database, `${dbName}/${value}/${uid}`), {
        displayName,
        photURL,
        value,
        uid,
    })
        .then(async () => {
            handleModalSubmit();
            const data = await getData(dbRef);
            appendVotersData(data, inputName, dbName);
            setTimeout(() => {
                handleModalSubmit();
            }, 3000)
        })
        .catch(err => {
            console.error('Save failed', err)
            toggleVisibility('error-modal', true);
        });
}

function openModal(modalClass, idPrefix) {
    document.body.style.overflow = 'hidden';
    appendVotersModal(idPrefix);
    toggleVisibility(modalClass, true);
}

function closeVotersModal(modalClass) {
    document.body.style.overflow = 'auto';
    toggleVisibility(modalClass, false);
}

window.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'seeMoreAge') {
        toggleVisibility('voters-list-so', false);
        toggleVisibility('voters-list-age', true);
        openModal('voters-modal', 'age');
        return;
    }
    if (e.target && e.target.id === 'seeMoreSO') {
        toggleVisibility('voters-list-age', false);
        toggleVisibility('voters-list-so', true);
        openModal('voters-modal', 'so');
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
