import { database, auth, signOut } from './firebase-config.js';
import { ref, set, get, update, getDatabase, onValue } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';

document.getElementById("issueInputForm").addEventListener("submit", saveIssue);
const db = getDatabase();
const dbRef = ref(db, 'age/');
const unsubscribe = onValue(dbRef, snapshot => {
    const data = snapshot.exists() ? snapshot.val() : {};
    appendVotersData(data);
});


function removeVoteFromList(id) {
    const voteContainer = document.querySelector(`img[id="${id}"]`);
    if (voteContainer) {
        voteContainer.remove();
    }
}

function appendVotersData(data) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const ageValues = Object.keys(data);
    ageValues.forEach(value => {
        const votersContainer = document.getElementById(`${value}-voters`);
        const totalVotesParagraph = votersContainer.querySelector('.total-votes');
        const imgContainer = votersContainer.querySelector('.img-container');
        totalVotesParagraph.textContent = `Total: ${Object.keys(data[value] || {}).length}`;
        Object.values(data[value]).forEach((entry, index) => {
            if (document.getElementById(entry.photURL)) {
                document.getElementById(entry.photURL).remove();
            }
            console.log(index)
            const img = document.createElement('img');
            img.style.position = 'relative';
            img.style.left = index === 0 ? '' : '-15px';
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
        console.error(error);
        return {};
    });
}

// Returns array of previous vote entries for the given uid (does NOT mutate DB).
const hasUserVotedInAnotherAge = (data, uid) => {
    if (!uid) return [];
    return Object.values(data).filter(entry => entry && entry[uid]);
}

function removePreviousVote(value, uid) {
    set(ref(database, "age/" + value + "/" + uid), null)
        .then(() => console.log('Previous vote removed'))
        .catch(err => console.error('Failed to remove previous vote', err));
}


async function saveIssue(e) {
    e.preventDefault();
    // Source - https://stackoverflow.com/a
    // Posted by Parthik Gosar, modified by community. See post 'Timeline' for change history
    // Retrieved 2026-01-24, License - CC BY-SA 3.0
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
            const photURL = entry[uid].photURL;
            console.log('Removing previous vote in group', ageGroup, uid, photURL);
            removePreviousVote(ageGroup, uid);
            removeVoteFromList(uid);
        });
    }


    set(ref(database, "age/" + value + "/" + uid), {
        displayName,
        photURL,
        value,
    })
        .then(async () => {
            const data = await getData();
            appendVotersData(data);
        })
        .catch(err => console.error('Save failed', err));
}

export { appendVotersData, getData };

// Call initDOM whenever auth state becomes signed-in. This avoids relying on
// other modules to call it and prevents circular import issues.
