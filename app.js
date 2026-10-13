/* ==========================================================================
   JFK OPS - AVC Issue Request & Voting System
   Application Logic - Data Management, State Synchronization, & Event Listeners
   ========================================================================== */

// --- Global App State Data ---
let issues = [];
let polls = [];
let votes = [];
let meetingNotes = [];
let sopChecklist = [];

// --- Default Production Data Structures (Clean State) ---
const DEFAULT_ISSUES = [];
const DEFAULT_POLLS = [];
const DEFAULT_VOTES = [];
const DEFAULT_MEETING_NOTES = [];

// 10-Step Post-Meeting Execution Checklist (from JFK OPS Monthly SOP)
const DEFAULT_SOP_CHECKLIST = [
    {
        id: 'step-1',
        step: 1,
        title: 'Collect and consolidate notes from all AVC attendees.',
        phase: 'Days 1–2',
        owner: 'Jess + Devin',
        description: 'Review notes from Devin, Rob, and Jess; separate confirmed decisions from pending questions, and assemble initial discussion points.',
        actionTarget: 'admin-notes',
        actionLabel: 'View Meeting Notes',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-2',
        step: 2,
        title: 'Document leadership responses, decisions and action items.',
        phase: 'Days 1–2',
        owner: 'Jess + Devin',
        description: 'Record specific leadership feedback, firm commitments, accountable POC owners, follow-up dates, and completion criteria.',
        actionTarget: 'admin-notes',
        actionLabel: 'Add Meeting Note',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-3',
        step: 3,
        title: 'Identify matters needing clarification or approval before sharing.',
        phase: 'Days 1–2',
        owner: 'Jess + Devin; Leadership as needed',
        description: 'Enforce accuracy rule: "Discussed" is not "approved." Flag sensitive personnel issues, unverified items, or topics needing GM / Director sign-off.',
        actionTarget: null,
        actionLabel: null,
        completed: false,
        completedAt: null
    },
    {
        id: 'step-4',
        step: 4,
        title: 'Assign portal issue updates and follow-ups to Rob.',
        phase: 'Days 2–3',
        owner: 'Rob',
        description: 'Hand off confirmed leadership decisions, new assigned owners, and next review dates for system maintenance in the VC Portal.',
        actionTarget: 'admin-issues',
        actionLabel: 'Review IR Master Table',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-5',
        step: 5,
        title: 'Assign documentation review and recap verification to Jess.',
        phase: 'Days 2–3',
        owner: 'Jess',
        description: 'Audit meeting logs, consolidate action summaries, cross-check against coordinator feedback, and verify completeness.',
        actionTarget: 'admin-notes',
        actionLabel: 'Review Notes & Actions',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-6',
        step: 6,
        title: 'Update confirmed statuses and follow-up dates in the VC Portal.',
        phase: 'Days 2–3',
        owner: 'Rob',
        description: 'Edit issue records: update operational status, next tactical actions, internal notes, and follow-up review dates based on verified meeting outcomes.',
        actionTarget: 'admin-issues',
        actionLabel: 'Manage IR Statuses',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-7',
        step: 7,
        title: 'Draft monthly department email and any accompanying graphic.',
        phase: 'Days 3–5',
        owner: 'Devin',
        description: 'Use the Email Builder (Option 2: Monthly Update or Option 1: Special Notice) to draft coordinator communications and prepare visual highlights.',
        actionTarget: 'admin-email',
        actionLabel: 'Open Email Builder',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-8',
        step: 8,
        title: 'Verify public wording and any leadership-sensitive information.',
        phase: 'Days 5–7',
        owner: 'Jess + Devin; Leadership as needed',
        description: 'Fact-check public recap, ensure appropriate tone, remove internal-only notes, and get leadership confirmation if required.',
        actionTarget: 'admin-email',
        actionLabel: 'Preview Email Content',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-9',
        step: 9,
        title: 'Publish email and corresponding portal update.',
        phase: 'Days 7–10',
        owner: 'Devin',
        description: 'Copy formatted plain text or rich HTML from Email Builder, send official department broadcast to coordinators, and post announcement.',
        actionTarget: 'admin-email',
        actionLabel: 'Copy & Send Email',
        completed: false,
        completedAt: null
    },
    {
        id: 'step-10',
        step: 10,
        title: 'Prepare outstanding items for the Devin x Perri one-on-one.',
        phase: 'When scheduled',
        owner: 'Devin',
        description: 'Assemble sensitive or detailed topics, unresolved questions, and long-term strategic items for flexible secondary checkpoint with leadership.',
        actionTarget: 'admin-notes',
        actionLabel: 'Review Outstanding Notes',
        completed: false,
        completedAt: null
    }
];

// --- App Navigation Manager ---
function switchTab(targetTabId) {
    // Update active class on nav links
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-target') === targetTabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update active class on page sections
    document.querySelectorAll('.page-section').forEach(section => {
        if (section.id === `page-${targetTabId}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Run custom page loaders
    if (targetTabId === 'dashboard') {
        loadDashboard();
    } else if (targetTabId === 'open-issues') {
        loadOpenIssues();
    } else if (targetTabId === 'vote') {
        loadVotePage();
    } else if (targetTabId === 'results') {
        loadResultsPage();
    } else if (targetTabId === 'updates') {
        loadUpdatesPage();
    } else if (targetTabId === 'admin') {
        loadAdminPage();
    }
}

// --- Database State & Cloud Synchronization Layer (Firebase Firestore + Local Storage) ---
let db = null;
let isCloudConnected = false;
let issuesUnsubscribe = null;
let pollsUnsubscribe = null;
let votesUnsubscribe = null;
let meetingNotesUnsubscribe = null;
let sopChecklistUnsubscribe = null;

function updateCloudStatusUI(connected, customMsg) {
    const badge = document.getElementById('cloud-status-badge');
    const dot = document.getElementById('cloud-status-dot');
    const label = document.getElementById('cloud-status-label');

    if (badge && dot && label) {
        if (connected) {
            badge.className = 'cloud-status-badge connected';
            label.textContent = customMsg || 'Cloud Synced';
            badge.title = 'Connected to Cloud Database: Real-time sync enabled for all link visitors';
        } else {
            badge.className = 'cloud-status-badge local';
            label.textContent = customMsg || 'Local Mode';
            badge.title = 'Running in Local Storage Mode: Connect Firebase in Admin Settings to share data across devices';
        }
    }

    // Admin maintenance tab elements
    const adminBox = document.getElementById('admin-cloud-status-box');
    const adminTitle = document.getElementById('admin-cloud-mode-title');
    const adminDesc = document.getElementById('admin-cloud-mode-desc');
    const adminBadge = document.getElementById('admin-cloud-mode-badge');

    if (adminBox && adminTitle && adminDesc && adminBadge) {
        const config = (typeof getActiveFirebaseConfig === 'function') ? getActiveFirebaseConfig() : null;
        if (connected) {
            adminTitle.textContent = `Database Mode: Google Cloud Firestore (${config?.projectId || 'Active'})`;
            adminDesc.textContent = 'All issues, polls, and votes are automatically shared across all devices and crew members opening the link in real time.';
            adminBadge.className = 'badge badge-status-completed';
            adminBadge.textContent = 'LIVE CLOUD SYNC';
        } else {
            adminTitle.textContent = 'Database Mode: Local Browser Storage (Single Device)';
            adminDesc.textContent = 'Data is currently stored only in this browser. To share data across your 30 crew members, enter your Firebase configuration below.';
            adminBadge.className = 'badge badge-priority-urgent';
            adminBadge.textContent = 'LOCAL ONLY';
        }
    }
}

function refreshActivePage() {
    const activeNav = document.querySelector('.nav-item.active');
    const target = activeNav ? activeNav.getAttribute('data-target') : 'dashboard';
    if (target === 'dashboard') loadDashboard();
    else if (target === 'open-issues') loadOpenIssues();
    else if (target === 'vote') loadVotePage();
    else if (target === 'results') loadResultsPage();
    else if (target === 'updates') loadUpdatesPage();
    else if (target === 'admin') loadAdminPage();
}

function initDataSync() {
    const config = (typeof getActiveFirebaseConfig === 'function') ? getActiveFirebaseConfig() : null;

    if (config && config.projectId && config.apiKey && typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(config);
            }
            db = firebase.firestore();
            isCloudConnected = true;
            updateCloudStatusUI(true, 'Connecting...');

            // Start realtime listeners for all collections
            startCloudListeners();
            return;
        } catch (err) {
            console.warn("Failed to connect Firebase Firestore:", err);
            isCloudConnected = false;
        }
    }

    // Fallback to local storage if Firebase is not yet configured or offline
    isCloudConnected = false;
    updateCloudStatusUI(false, 'Local Mode');
    loadDataFromStorage();
}

function startCloudListeners() {
    if (!db) return;

    try {
        // 1. Issues Realtime Listener
        if (issuesUnsubscribe) issuesUnsubscribe();
        issuesUnsubscribe = db.collection('issues').onSnapshot(snapshot => {
            const cloudIssues = [];
            snapshot.forEach(doc => {
                cloudIssues.push(doc.data());
            });
            cloudIssues.sort((a, b) => new Date(b.date) - new Date(a.date));
            issues = cloudIssues;
            saveIssuesToStorage();
            updateCloudStatusUI(true, 'Cloud Synced');
            refreshActivePage();
        }, err => {
            console.error("Firestore issues listener error:", err);
            updateCloudStatusUI(false, 'Sync Offline');
        });

        // 2. Polls Realtime Listener
        if (pollsUnsubscribe) pollsUnsubscribe();
        pollsUnsubscribe = db.collection('polls').onSnapshot(snapshot => {
            const cloudPolls = [];
            snapshot.forEach(doc => {
                cloudPolls.push(doc.data());
            });
            polls = cloudPolls;
            savePollsToStorage();
            updateCloudStatusUI(true, 'Cloud Synced');
            refreshActivePage();
        }, err => {
            console.error("Firestore polls listener error:", err);
            updateCloudStatusUI(false, 'Sync Offline');
        });

        // 3. Votes Realtime Listener
        if (votesUnsubscribe) votesUnsubscribe();
        votesUnsubscribe = db.collection('votes').onSnapshot(snapshot => {
            const cloudVotes = [];
            snapshot.forEach(doc => {
                cloudVotes.push(doc.data());
            });
            votes = cloudVotes;
            saveVotesToStorage();
            updateCloudStatusUI(true, 'Cloud Synced');
            refreshActivePage();
        }, err => {
            console.error("Firestore votes listener error:", err);
            updateCloudStatusUI(false, 'Sync Offline');
        });

        // 4. Meeting Notes Realtime Listener
        if (meetingNotesUnsubscribe) meetingNotesUnsubscribe();
        meetingNotesUnsubscribe = db.collection('meetingNotes').onSnapshot(snapshot => {
            const cloudNotes = [];
            snapshot.forEach(doc => {
                cloudNotes.push(doc.data());
            });
            cloudNotes.sort((a, b) => new Date(b.date || b.updatedAt || 0) - new Date(a.date || a.updatedAt || 0));
            meetingNotes = cloudNotes;
            saveMeetingNotesToStorage();
            updateCloudStatusUI(true, 'Cloud Synced');
            refreshActivePage();
        }, err => {
            console.error("Firestore meetingNotes listener error:", err);
            updateCloudStatusUI(false, 'Sync Offline');
        });

        // 5. SOP Execution Checklist Realtime Listener
        if (sopChecklistUnsubscribe) sopChecklistUnsubscribe();
        sopChecklistUnsubscribe = db.collection('systemSettings').doc('sopChecklist').onSnapshot(doc => {
            if (doc.exists && doc.data().checklist) {
                const cloudChecklist = doc.data().checklist;
                if (Array.isArray(cloudChecklist) && cloudChecklist.length > 0) {
                    sopChecklist = DEFAULT_SOP_CHECKLIST.map(defItem => {
                        const existing = cloudChecklist.find(p => p.id === defItem.id);
                        return existing ? { ...defItem, ...existing } : { ...defItem };
                    });
                    localStorage.setItem('jfk_ops_sop_checklist', JSON.stringify(sopChecklist));
                    renderSOPChecklist();
                }
            }
        }, err => {
            console.warn("Firestore sopChecklist listener notice:", err);
        });
    } catch (e) {
        console.warn("Error establishing cloud listeners:", e);
        loadDataFromStorage();
    }
}

function loadDataFromStorage() {
    // Migration check: Ensure database starts clean for production 30-member crew deployment
    const productionInit = localStorage.getItem('jfk_ops_v2_clean_init');
    if (!productionInit) {
        localStorage.setItem('jfk_ops_issues', JSON.stringify([]));
        localStorage.setItem('jfk_ops_polls', JSON.stringify([]));
        localStorage.setItem('jfk_ops_votes', JSON.stringify([]));
        localStorage.setItem('jfk_ops_meeting_notes', JSON.stringify([]));
        localStorage.setItem('jfk_ops_sop_checklist', JSON.stringify(DEFAULT_SOP_CHECKLIST));
        localStorage.setItem('jfk_ops_v2_clean_init', 'true');
    }

    const storedIssues = localStorage.getItem('jfk_ops_issues');
    const storedPolls = localStorage.getItem('jfk_ops_polls');
    const storedVotes = localStorage.getItem('jfk_ops_votes');
    const storedNotes = localStorage.getItem('jfk_ops_meeting_notes');
    const storedChecklist = localStorage.getItem('jfk_ops_sop_checklist');

    if (storedIssues) {
        issues = JSON.parse(storedIssues);
    } else {
        issues = [...DEFAULT_ISSUES];
        saveIssuesToStorage();
    }

    if (storedPolls) {
        polls = JSON.parse(storedPolls);
    } else {
        polls = [...DEFAULT_POLLS];
        savePollsToStorage();
    }

    if (storedVotes) {
        votes = JSON.parse(storedVotes);
    } else {
        votes = [...DEFAULT_VOTES];
        saveVotesToStorage();
    }

    if (storedNotes) {
        try {
            meetingNotes = JSON.parse(storedNotes);
        } catch (e) {
            meetingNotes = [...DEFAULT_MEETING_NOTES];
        }
    } else {
        meetingNotes = [...DEFAULT_MEETING_NOTES];
        saveMeetingNotesToStorage();
    }

    if (storedChecklist) {
        try {
            const parsed = JSON.parse(storedChecklist);
            sopChecklist = DEFAULT_SOP_CHECKLIST.map(defItem => {
                const existing = parsed.find(p => p.id === defItem.id);
                return existing ? { ...defItem, ...existing } : { ...defItem };
            });
        } catch (e) {
            sopChecklist = JSON.parse(JSON.stringify(DEFAULT_SOP_CHECKLIST));
        }
    } else {
        sopChecklist = JSON.parse(JSON.stringify(DEFAULT_SOP_CHECKLIST));
        saveSOPChecklistToStorage(false);
    }
}

function saveIssuesToStorage() {
    localStorage.setItem('jfk_ops_issues', JSON.stringify(issues));
}

function savePollsToStorage() {
    localStorage.setItem('jfk_ops_polls', JSON.stringify(polls));
}

function saveVotesToStorage() {
    localStorage.setItem('jfk_ops_votes', JSON.stringify(votes));
}

function saveMeetingNotesToStorage() {
    localStorage.setItem('jfk_ops_meeting_notes', JSON.stringify(meetingNotes));
}

function saveSOPChecklistToStorage(syncCloud = true) {
    localStorage.setItem('jfk_ops_sop_checklist', JSON.stringify(sopChecklist));
    if (syncCloud && isCloudConnected && db) {
        try {
            db.collection('systemSettings').doc('sopChecklist').set({
                checklist: sopChecklist,
                updatedAt: new Date().toISOString()
            }, { merge: true }).catch(err => {
                console.warn("Error saving sopChecklist to Firestore:", err);
            });
        } catch (e) {
            console.warn("Firestore saveSOPChecklist error:", e);
        }
    }
}

// --- Cloud-aware Save & Delete Operations ---
async function saveIssueRecord(issueObj) {
    const existingIdx = issues.findIndex(i => i.irNumber === issueObj.irNumber);
    if (existingIdx >= 0) {
        issues[existingIdx] = issueObj;
    } else {
        issues.unshift(issueObj);
    }
    saveIssuesToStorage();

    if (isCloudConnected && db) {
        try {
            await db.collection('issues').doc(issueObj.irNumber).set(issueObj);
        } catch (e) {
            console.error("Error saving issue to Firestore:", e);
        }
    }
}

async function deleteIssueRecord(irNumber) {
    issues = issues.filter(i => i.irNumber !== irNumber);
    saveIssuesToStorage();

    if (isCloudConnected && db) {
        try {
            await db.collection('issues').doc(irNumber).delete();
        } catch (e) {
            console.error("Error deleting issue from Firestore:", e);
        }
    }
}

async function saveMeetingNoteRecord(noteObj) {
    const existingIdx = meetingNotes.findIndex(n => n.id === noteObj.id);
    if (existingIdx >= 0) {
        meetingNotes[existingIdx] = noteObj;
    } else {
        meetingNotes.unshift(noteObj);
    }
    saveMeetingNotesToStorage();

    if (isCloudConnected && db) {
        try {
            await db.collection('meetingNotes').doc(noteObj.id).set(noteObj);
        } catch (e) {
            console.error("Error saving meeting note to Firestore:", e);
        }
    }
}

async function deleteMeetingNoteRecord(noteId) {
    meetingNotes = meetingNotes.filter(n => n.id !== noteId);
    saveMeetingNotesToStorage();

    if (isCloudConnected && db) {
        try {
            await db.collection('meetingNotes').doc(noteId).delete();
        } catch (e) {
            console.error("Error deleting meeting note from Firestore:", e);
        }
    }
}

async function savePollRecord(pollObj) {
    const existingIdx = polls.findIndex(p => p.pollId === pollObj.pollId);
    if (existingIdx >= 0) {
        polls[existingIdx] = pollObj;
    } else {
        polls.unshift(pollObj);
    }
    savePollsToStorage();

    if (isCloudConnected && db) {
        try {
            await db.collection('polls').doc(pollObj.pollId).set(pollObj);
        } catch (e) {
            console.error("Error saving poll to Firestore:", e);
        }
    }
}

async function saveVoteRecord(ballotObj) {
    votes.push(ballotObj);
    saveVotesToStorage();

    if (isCloudConnected && db) {
        try {
            const safeDocId = `${ballotObj.pollId}_${ballotObj.id}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            await db.collection('votes').doc(safeDocId).set(ballotObj);
        } catch (e) {
            console.error("Error saving vote to Firestore:", e);
        }
    }
}

async function deleteVoteRecord(pollId, cmId, timestamp) {
    votes = votes.filter(v => !(v.pollId === pollId && v.id === cmId && v.timestamp === timestamp));
    saveVotesToStorage();

    if (isCloudConnected && db) {
        try {
            const snapshot = await db.collection('votes')
                .where('pollId', '==', pollId)
                .where('id', '==', cmId)
                .get();
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (e) {
            console.error("Error deleting vote from Firestore:", e);
        }
    }
}

async function resetPollVotesRecord(pollId) {
    votes = votes.filter(v => v.pollId !== pollId);
    saveVotesToStorage();

    if (isCloudConnected && db) {
        try {
            const snapshot = await db.collection('votes').where('pollId', '==', pollId).get();
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (e) {
            console.error("Error wiping poll votes in Firestore:", e);
        }
    }
}

async function wipeCloudDatabase() {
    if (isCloudConnected && db) {
        try {
            const collections = ['issues', 'polls', 'votes', 'meetingNotes'];
            for (const col of collections) {
                const snapshot = await db.collection(col).get();
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }
        } catch (e) {
            console.error("Error wiping Firestore database:", e);
        }
    }
}

async function resetDemoData() {
    const doubleConfirm = confirm(
        "⚠️ DANGER: This will permanently WIPE OUT all database data, including all issues, voting polls, coordinator ballots, and progress history across both cloud and local storage.\n\nAre you absolutely sure you want to proceed with this wipe?"
    );
    if (doubleConfirm) {
        if (isCloudConnected) {
            await wipeCloudDatabase();
        }
        localStorage.setItem('jfk_ops_issues', JSON.stringify([]));
        localStorage.setItem('jfk_ops_polls', JSON.stringify([]));
        localStorage.setItem('jfk_ops_votes', JSON.stringify([]));
        localStorage.setItem('jfk_ops_meeting_notes', JSON.stringify([]));
        localStorage.setItem('jfk_ops_sop_checklist', JSON.stringify(DEFAULT_SOP_CHECKLIST));
        localStorage.setItem('jfk_ops_v2_clean_init', 'true');
        
        alert("System database has been wiped clean. Starting fresh!");
        location.reload();
    }
}

// --- Dashboard Loading ---
function loadDashboard() {
    // 1. Calculate simplified status rollups
    let openPendingCount = 0;
    let activeVotesCount = 0;
    let leadershipReviewCount = 0;
    let approvedCompletedCount = 0;

    issues.forEach(ir => {
        if (['SUBMITTED', 'UNDER REVIEW', 'NEEDS INFORMATION', 'BLOCKED'].includes(ir.status)) {
            openPendingCount++;
        } else if (ir.status === 'VOTING') {
            activeVotesCount++;
        } else if (ir.status === 'SUBMITTED TO LEADERSHIP') {
            leadershipReviewCount++;
        } else if (['APPROVED', 'IMPLEMENTING', 'COMPLETED'].includes(ir.status)) {
            approvedCompletedCount++;
        }
    });

    const activePollsCount = polls.filter(p => p.status === 'OPEN').length;
    document.getElementById('active-votes-count-badge').textContent = `${activePollsCount} Active`;

    // Render Stats Grid HTML
    const statsHtml = `
        <div class="stat-card">
            <div class="stat-val">${openPendingCount}</div>
            <div class="stat-lbl">Open Issues / Under Review</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">${activeVotesCount}</div>
            <div class="stat-lbl">Active Department Votes</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">${leadershipReviewCount}</div>
            <div class="stat-lbl">Submitted to Leadership</div>
        </div>
        <div class="stat-card">
            <div class="stat-val">${approvedCompletedCount}</div>
            <div class="stat-lbl">Approved / Completed</div>
        </div>
    `;
    document.getElementById('stats-summary-grid').innerHTML = statsHtml;

    // 2. Render Active Polls
    const activePolls = polls.filter(p => p.status === 'OPEN');
    let activePollsHtml = '';
    if (activePolls.length === 0) {
        activePollsHtml = '<p class="text-muted">No active coordinator polls at this time.</p>';
    } else {
        activePolls.forEach(p => {
            const pVotes = votes.filter(v => v.pollId === p.pollId);
            activePollsHtml += `
                <div class="followup-item">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="followup-title" style="margin-top:0;">${p.title}</span>
                        <button class="btn btn-xs btn-primary" onclick="openBallotModal('${p.pollId}')">Vote Now</button>
                    </div>
                    <p class="text-muted mt-2" style="font-size:12.5px;">${p.description.substring(0, 120)}...</p>
                    <div class="followup-action mt-2">
                        <span>Participation: <strong>${pVotes.length}</strong> / ${p.eligibleVoters || 30} Coordinators (${Math.round((pVotes.length / (p.eligibleVoters || 30)) * 100) || 0}%)</span>
                    </div>
                </div>
            `;
        });
    }
    document.getElementById('dashboard-active-polls').innerHTML = activePollsHtml;

    // 3. Render Recent Issues List (Limit to 5)
    const sortedIssues = [...issues].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    let recentIssuesHtml = '';
    sortedIssues.forEach(ir => {
        const dateStr = new Date(ir.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        recentIssuesHtml += `
            <tr class="mobile-card-row" style="cursor: pointer;" onclick="openViewIssueModal('${ir.irNumber}')">
                <td class="cell-ir"><strong class="text-muted font-mono" style="font-family:var(--font-mono);">${ir.irNumber}</strong></td>
                <td class="cell-title">${ir.title}</td>
                <td class="cell-cat"><span class="text-muted" style="font-size:13px; font-weight:500;">${ir.category}</span></td>
                <td class="cell-priority"><span class="badge badge-priority-${ir.priority.toLowerCase()}">${ir.priority}</span></td>
                <td class="cell-date" style="font-family:var(--font-mono); font-size:12px;">${dateStr}</td>
                <td class="cell-status"><span class="badge badge-status-${ir.status.toLowerCase().replace(/ /g, '-')}">${ir.status}</span></td>
            </tr>
        `;
    });
    if (sortedIssues.length === 0) {
        recentIssuesHtml = '<tr><td colspan="6" class="text-center text-muted">No issue requests found.</td></tr>';
    }
    document.getElementById('dashboard-recent-issues').innerHTML = recentIssuesHtml;

    // 4. Render Upcoming Follow-Ups
    const followups = issues.filter(ir => ir.followUpDate && ir.status !== 'COMPLETED' && ir.status !== 'ARCHIVED' && ir.status !== 'DENIED');
    const sortedFollowups = [...followups].sort((a,b) => new Date(a.followUpDate) - new Date(b.followUpDate)).slice(0, 4);
    let followupsHtml = '';
    sortedFollowups.forEach(f => {
        const targetDate = new Date(f.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        followupsHtml += `
            <li class="followup-item" style="cursor: pointer;" onclick="openViewIssueModal('${f.irNumber}')">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="followup-date">${targetDate}</span>
                    <span class="badge badge-status-${f.status.toLowerCase().replace(/ /g, '-')}">${f.status}</span>
                </div>
                <div class="followup-title">${f.title}</div>
                <div class="followup-action"><strong>Next Action:</strong> ${f.nextAction || 'Wait for review'}</div>
            </li>
        `;
    });
    if (sortedFollowups.length === 0) {
        followupsHtml = '<li class="text-muted" style="font-size:13px;">No pending target follow-up actions recorded.</li>';
    }
    document.getElementById('dashboard-followups').innerHTML = followupsHtml;

}

// --- Submit Issue Form Management ---
async function handleIssueSubmit(event) {
    event.preventDefault();

    // Capture fields
    const name = document.getElementById('submitter-name').value.trim();
    const employeeId = document.getElementById('submitter-id').value.trim();
    const shift = document.getElementById('submitter-shift').value;
    const category = document.getElementById('issue-category').value;
    const priority = document.getElementById('issue-priority').value;
    const title = document.getElementById('issue-title').value.trim();
    const description = document.getElementById('issue-description').value.trim();
    const impact = document.getElementById('issue-impact').value.trim();
    const examples = document.getElementById('issue-examples').value.trim();
    const proposedSolution = document.getElementById('issue-solution').value.trim();
    const comments = document.getElementById('issue-comments').value.trim();
    const isAnonymous = document.getElementById('submit-anonymous') ? document.getElementById('submit-anonymous').checked : false;
    
    const voteRad = document.querySelector('input[name="vote-consideration"]:checked');
    const voteRequested = voteRad ? voteRad.value : "Unsure / AVC Decide";

    // Generate Request Number (IR-2026-XXX)
    // Find highest index
    let maxIdx = 0;
    issues.forEach(ir => {
        const match = ir.irNumber.match(/IR-2026-(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxIdx) maxIdx = num;
        }
    });
    const nextIdxStr = String(maxIdx + 1).padStart(3, '0');
    const irNumber = `IR-2026-${nextIdxStr}`;

    const newIssue = {
        irNumber: irNumber,
        name: name,
        id: employeeId,
        shift: shift,
        isAnonymous: isAnonymous,
        date: new Date().toISOString(),
        category: category,
        title: title,
        description: description,
        impact: impact,
        examples: examples,
        proposedSolution: proposedSolution,
        solution: proposedSolution,
        priority: priority,
        voteRequested: voteRequested,
        status: "SUBMITTED",
        owner: "Unassigned",
        notes: "",
        leadershipResponse: "",
        nextAction: "Initial evaluation by AVC",
        followUpDate: "",
        decisionSummary: "",
        history: [
            {
                status: "SUBMITTED",
                timestamp: new Date().toISOString(),
                note: isAnonymous
                    ? `Issue request submitted anonymously by ${name} (ID: ${employeeId})`
                    : `Issue request submitted by ${name} (ID: ${employeeId})`
            }
        ]
    };

    // Save to list and sync with cloud
    await saveIssueRecord(newIssue);

    // Trigger success screen overlay
    document.getElementById('success-ir-number').textContent = irNumber;
    document.getElementById('submission-success-screen').classList.remove('hidden');
}

function resetSubmitFormAndNavigate(tabName) {
    // Hide success overlay
    document.getElementById('submission-success-screen').classList.add('hidden');
    // Reset form
    document.getElementById('issue-request-form').reset();
    // Re-trigger simulator fields if active
    syncDemoLoginFields();
    // Switch tab
    switchTab(tabName);
}

// --- Open Issues Board Filters & Loading ---
function loadOpenIssues() {
    const searchVal = document.getElementById('issues-search').value.toLowerCase();
    const catVal = document.getElementById('filter-category').value;
    const statusVal = document.getElementById('filter-status').value;
    const priorityVal = document.getElementById('filter-priority').value;

    const container = document.getElementById('issues-list-container');
    container.innerHTML = '';

    // Filter list (hide ARCHIVED by default if category/status not explicitly set to archived)
    const filtered = issues.filter(ir => {
        // Search filter
        const matchSearch = ir.irNumber.toLowerCase().includes(searchVal) ||
                            ir.title.toLowerCase().includes(searchVal) ||
                            ir.description.toLowerCase().includes(searchVal) ||
                            ir.category.toLowerCase().includes(searchVal);
        
        // Category filter
        const matchCat = (catVal === 'all') || (ir.category === catVal);
        
        // Status filter
        const matchStatus = (statusVal === 'all') ? (ir.status !== 'ARCHIVED') : (ir.status === statusVal);

        // Priority filter
        const matchPriority = (priorityVal === 'all') || (ir.priority === priorityVal);

        return matchSearch && matchCat && matchStatus && matchPriority;
    });

    if (filtered.length === 0) {
        document.getElementById('no-issues-found-message').classList.remove('hidden');
    } else {
        document.getElementById('no-issues-found-message').classList.add('hidden');
        filtered.forEach(ir => {
            const dateStr = new Date(ir.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const card = document.createElement('div');
            card.className = 'issue-card';
            card.onclick = () => openViewIssueModal(ir.irNumber);

            card.innerHTML = `
                <div class="issue-card-meta">
                    <span class="issue-ir-id">${ir.irNumber}</span>
                    <span class="badge badge-priority-${ir.priority.toLowerCase()}">${ir.priority}</span>
                </div>
                <div>
                    <h4 class="issue-card-title">${ir.title}</h4>
                    <span class="issue-card-category">${ir.category}</span>
                </div>
                <p class="issue-card-snippet">${ir.description}</p>
                <div class="issue-card-footer">
                    <span class="issue-card-date">${dateStr}</span>
                    <span class="badge badge-status-${ir.status.toLowerCase().replace(/ /g, '-')}">${ir.status}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// --- Coordinator Voting Dashboard Load ---
function loadVotePage() {
    const container = document.getElementById('polls-list-container');
    container.innerHTML = '';

    const openPolls = polls.filter(p => p.status === 'OPEN');

    if (openPolls.length === 0) {
        document.getElementById('no-polls-found-message').classList.remove('hidden');
    } else {
        document.getElementById('no-polls-found-message').classList.add('hidden');
        
        openPolls.forEach(p => {
            const pVotes = votes.filter(v => v.pollId === p.pollId);
            const closeDateStr = new Date(p.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            const card = document.createElement('div');
            card.className = 'poll-card';
            
            card.innerHTML = `
                <div class="poll-card-header">
                    <div class="poll-status-indicator">ACTIVE DEPT VOTE</div>
                    <span class="poll-dates">CLOSES: ${closeDateStr}</span>
                </div>
                <div class="poll-body">
                    <h3 class="poll-title">${p.title}</h3>
                    <p class="poll-description">${p.description}</p>
                    
                    <div class="poll-options-grid">
                        <div class="poll-option-preview">
                            <span class="poll-opt-num">Option 1</span>
                            <span class="poll-opt-lbl">${p.option1}</span>
                            <span class="poll-opt-text">${p.option1Desc || ''}</span>
                        </div>
                        <div class="poll-option-preview">
                            <span class="poll-opt-num">Option 2</span>
                            <span class="poll-opt-lbl">${p.option2}</span>
                            <span class="poll-opt-text">${p.option2Desc || ''}</span>
                        </div>
                        <div class="poll-option-preview">
                            <span class="poll-opt-num">Option 3</span>
                            <span class="poll-opt-lbl">${p.option3}</span>
                            <span class="poll-opt-text">${p.option3Desc || ''}</span>
                        </div>
                    </div>
                </div>
                <div class="poll-card-footer">
                    <div class="poll-dates">
                        Participation: <strong>${pVotes.length}</strong> / ${p.eligibleVoters || 30} Crewmembers (${Math.round((pVotes.length / (p.eligibleVoters || 30)) * 100) || 0}%)
                    </div>
                    <button class="btn btn-primary" onclick="openBallotModal('${p.pollId}')">Submit Vote</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// --- Results Dashboard Loading ---
function loadResultsPage() {
    const container = document.getElementById('results-dashboard-container');
    container.innerHTML = '';

    if (polls.length === 0) {
        container.innerHTML = `
            <div class="empty-state-card" style="grid-column: 1 / -1; text-align:center; padding: 48px 20px; background: white; border-radius: 8px; border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-chart-column" style="font-size: 40px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h4 style="margin-bottom: 8px; color: var(--navy-dark);">No Voting Results Available</h4>
                <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto; font-size: 14px;">There are no active or completed coordinator ballots recorded yet. Results will appear here once department polls are created and votes are submitted.</p>
            </div>
        `;
        return;
    }

    polls.forEach(p => {
        // Find votes for this poll
        const pVotes = votes.filter(v => v.pollId === p.pollId);
        const count1 = pVotes.filter(v => v.option === 'Option 1').length;
        const count2 = pVotes.filter(v => v.option === 'Option 2').length;
        const count3 = pVotes.filter(v => v.option === 'Option 3').length;
        const total = pVotes.length || 1; // prevent divide by zero

        const pct1 = Math.round((count1 / total) * 100);
        const pct2 = Math.round((count2 / total) * 100);
        const pct3 = Math.round((count3 / total) * 100);

        const card = document.createElement('div');
        card.className = 'results-card';

        // Extract comment bubbles
        let commentsHtml = '';
        const commentsList = pVotes.filter(v => v.comment && v.comment.trim() !== '');
        if (commentsList.length > 0) {
            commentsHtml = `
                <div class="results-comments-section">
                    <h5 class="results-comments-title">Crew Feedback Comments</h5>
                    <div class="results-comments-list">
                        ${commentsList.map(c => `<div class="results-comment-bubble">"${c.comment}"</div>`).join('')}
                    </div>
                </div>
            `;
        }

        const isClosed = p.status === 'CLOSED' || p.status === 'ARCHIVED';

        card.innerHTML = `
            <div class="results-header">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                    <h3 class="results-proposal-title">${p.title}</h3>
                    <span class="badge ${isClosed ? 'badge-status-archived' : 'badge-status-voting'}">${p.status}</span>
                </div>
                <div class="results-meta-row mt-2">
                    <span class="results-meta-item">Eligible Voters: <span class="results-meta-val">${p.eligibleVoters || 30}</span></span>
                    <span class="results-meta-item">Votes Received: <span class="results-meta-val">${pVotes.length}</span></span>
                    <span class="results-meta-item">Participation: <span class="results-meta-val">${Math.round((pVotes.length / (p.eligibleVoters || 30)) * 100) || 0}%</span></span>
                </div>
            </div>

            <div class="results-chart-container">
                <!-- Option 1 -->
                <div class="chart-bar-group">
                    <div class="chart-bar-labels">
                        <span class="chart-bar-opt-name">${p.option1}</span>
                        <span class="chart-bar-percent">${pct1}%</span>
                    </div>
                    <div class="chart-bar-outer">
                        <div class="chart-bar-inner" style="width: ${pct1}%; background-color: var(--primary-color);"></div>
                        <span class="chart-bar-vote-count">${count1} votes</span>
                    </div>
                </div>
                
                <!-- Option 2 -->
                <div class="chart-bar-group">
                    <div class="chart-bar-labels">
                        <span class="chart-bar-opt-name">${p.option2}</span>
                        <span class="chart-bar-percent">${pct2}%</span>
                    </div>
                    <div class="chart-bar-outer">
                        <div class="chart-bar-inner" style="width: ${pct2}%; background-color: var(--accent-color);"></div>
                        <span class="chart-bar-vote-count">${count2} votes</span>
                    </div>
                </div>

                <!-- Option 3 -->
                <div class="chart-bar-group">
                    <div class="chart-bar-labels">
                        <span class="chart-bar-opt-name">${p.option3}</span>
                        <span class="chart-bar-percent">${pct3}%</span>
                    </div>
                    <div class="chart-bar-outer">
                        <div class="chart-bar-inner" style="width: ${pct3}%; background-color: var(--text-muted);"></div>
                        <span class="chart-bar-vote-count">${count3} votes</span>
                    </div>
                </div>
            </div>

            ${commentsHtml}
        `;
        container.appendChild(card);
    });
}

// --- Quarterly Transparency Updates Loading ---
function loadUpdatesPage() {
    const yearVal = parseInt(document.getElementById('report-year-select').value);
    const quarterVal = document.getElementById('report-quarter-select').value;
    const content = document.getElementById('quarterly-report-content');

    // Filter issues in target periods dynamically
    let rangeStart, rangeEnd, labelText;
    if (quarterVal === 'Q1') {
        rangeStart = new Date(`${yearVal}-01-01T00:00:00`);
        rangeEnd = new Date(`${yearVal}-03-31T23:59:59`);
        labelText = `Q1 ${yearVal} (Jan - Mar ${yearVal})`;
    } else if (quarterVal === 'Q2') {
        rangeStart = new Date(`${yearVal}-04-01T00:00:00`);
        rangeEnd = new Date(`${yearVal}-06-30T23:59:59`);
        labelText = `Q2 ${yearVal} (Apr - Jun ${yearVal})`;
    } else if (quarterVal === 'Q3') {
        rangeStart = new Date(`${yearVal}-07-01T00:00:00`);
        rangeEnd = new Date(`${yearVal}-09-30T23:59:59`);
        labelText = `Q3 ${yearVal} (Jul - Sep ${yearVal})`;
    } else {
        rangeStart = new Date(`${yearVal}-10-01T00:00:00`);
        rangeEnd = new Date(`${yearVal}-12-31T23:59:59`);
        labelText = `Q4 ${yearVal} (Oct - Dec ${yearVal})`;
    }

    const quarterIssues = issues.filter(ir => {
        const d = new Date(ir.date);
        return d >= rangeStart && d <= rangeEnd;
    });

    const totalSubmitted = quarterIssues.length;
    const underReview = quarterIssues.filter(ir => ir.status === 'UNDER REVIEW' || ir.status === 'NEEDS INFORMATION').length;
    const activeVotes = quarterIssues.filter(ir => ir.status === 'VOTING').length;
    const elevated = quarterIssues.filter(ir => ir.status === 'SUBMITTED TO LEADERSHIP').length;
    const approved = quarterIssues.filter(ir => ir.status === 'APPROVED' || ir.status === 'IMPLEMENTING').length;
    const completed = quarterIssues.filter(ir => ir.status === 'COMPLETED').length;

    // Grouping content
    const toldUsList = quarterIssues.map(ir => `
        <li class="report-bullet-item">
            <span class="report-bullet-title">${ir.title} (${ir.irNumber})</span>: 
            ${ir.description.substring(0, 140)}... 
            <span class="badge badge-status-${ir.status.toLowerCase().replace(/ /g, '-')}">${ir.status}</span>
        </li>
    `).join('') || '<li class="text-muted">No issues submitted during this quarter.</li>';

    // What you voted for
    const voteDetailsList = polls.map(p => {
        // If poll date fits the quarter
        const pVotes = votes.filter(v => v.pollId === p.pollId);
        const count1 = pVotes.filter(v => v.option === 'Option 1').length;
        const count2 = pVotes.filter(v => v.option === 'Option 2').length;
        const count3 = pVotes.filter(v => v.option === 'Option 3').length;
        const total = pVotes.length || 1;

        return `
            <div class="report-vote-summary">
                <span class="report-vote-prop-title">${p.title} (${p.pollId})</span>
                <div style="font-size:12px; color:#475569;">
                    Participation: <strong>${pVotes.length}</strong> votes. 
                    Results: ${p.option1} (${Math.round((count1/total)*100)}%) | 
                    ${p.option2} (${Math.round((count2/total)*100)}%) | 
                    ${p.option3} (${Math.round((count3/total)*100)}%)
                </div>
            </div>
        `;
    }).join('');

    // Leadership response
    const leadershipActions = quarterIssues.filter(ir => ir.leadershipResponse && ir.leadershipResponse.trim() !== '');
    const leadershipResponseHtml = leadershipActions.map(ir => `
        <li class="report-bullet-item">
            <span class="report-bullet-title">${ir.title}</span>: 
            "${ir.leadershipResponse}"
        </li>
    `).join('') || '<li class="text-muted">No leadership responses recorded in this window.</li>';

    // Implementing
    const implementingList = quarterIssues.filter(ir => ir.status === 'IMPLEMENTING').map(ir => `
        <li class="report-bullet-item">
            <span class="report-bullet-title">${ir.title}</span> - 
            Owner: ${ir.owner || 'AVC Representative'}. Target Action: ${ir.nextAction || 'Underway'}
        </li>
    `).join('') || '<li class="text-muted">No projects currently undergoing implementation.</li>';

    // Completed
    const completedList = quarterIssues.filter(ir => ir.status === 'COMPLETED').map(ir => `
        <li class="report-bullet-item">
            <span class="report-bullet-title">${ir.title}</span>: 
            ${ir.decisionSummary || 'Action items completed and closed.'}
        </li>
    `).join('') || '<li class="text-muted">No items closed as completed this period.</li>';

    // What's next
    const pendingList = quarterIssues.filter(ir => ir.status === 'SUBMITTED' || ir.status === 'UNDER REVIEW');
    const whatsNextHtml = pendingList.slice(0, 3).map(ir => `
        <li class="report-bullet-item">
            <span class="report-bullet-title">${ir.title}</span>: Target follow-up is scheduled to evaluate next steps.
        </li>
    `).join('') || '<li class="text-muted">No upcoming issues queued.</li>';

    content.innerHTML = `
        <div class="report-header">
            <div>
                <h2 class="report-logo-text">JFK OPS AVC</h2>
                <p class="report-logo-sub">Quarterly Accountability Report</p>
            </div>
            <div class="report-period">
                <div>Period: ${labelText}</div>
                <div style="font-size:11px; opacity:0.8; font-weight:400;">Report Generated: ${new Date().toLocaleDateString()}</div>
            </div>
        </div>

        <!-- Metric summaries -->
        <div class="report-summary-boxes">
            <div class="report-sum-box">
                <div class="report-sum-val">${totalSubmitted}</div>
                <div class="report-sum-lbl">Submitted</div>
            </div>
            <div class="report-sum-box">
                <div class="report-sum-val">${underReview}</div>
                <div class="report-sum-lbl">In Review</div>
            </div>
            <div class="report-sum-box">
                <div class="report-sum-val">${elevated}</div>
                <div class="report-sum-lbl">Elevated</div>
            </div>
            <div class="report-sum-box">
                <div class="report-sum-val">${approved}</div>
                <div class="report-sum-lbl">Approved</div>
            </div>
            <div class="report-sum-box">
                <div class="report-sum-val">${completed}</div>
                <div class="report-sum-lbl">Completed</div>
            </div>
            <div class="report-sum-box">
                <div class="report-sum-val">${activeVotes ? 1 : 0}</div>
                <div class="report-sum-lbl">Active Vote</div>
            </div>
        </div>

        <!-- 1. What you told us -->
        <div class="report-section-divider">
            <h3 class="report-sec-title">1. What You Told Us (Coordinator Feedback)</h3>
            <div class="report-sec-content">
                <ul class="report-bullet-list">
                    ${toldUsList}
                </ul>
            </div>
        </div>

        <!-- 2. What you voted for -->
        <div class="report-section-divider" style="margin-top:20px;">
            <h3 class="report-sec-title">2. What You Voted For (Department Votes)</h3>
            <div class="report-sec-content">
                ${voteDetailsList || '<p class="text-muted">No votes registered in this quarter.</p>'}
            </div>
        </div>

        <!-- 3. What AVC submitted to leadership -->
        <div class="report-section-divider" style="margin-top:20px;">
            <h3 class="report-sec-title">3. Action Items Formally Elevated</h3>
            <div class="report-sec-content">
                <p style="margin-bottom:8px;">The following proposals were officially prepared and presented to JFK Operations and Airport management:</p>
                <ul class="report-bullet-list">
                    ${quarterIssues.filter(ir => ir.status === 'SUBMITTED TO LEADERSHIP').map(ir => `<li class="report-bullet-item"><span class="report-bullet-title">${ir.title}</span> - Pending scheduling of review board.</li>`).join('') || '<li class="text-muted">No items are currently awaiting leadership roundtable debate.</li>'}
                </ul>
            </div>
        </div>

        <!-- 4. Leadership Response -->
        <div class="report-section-divider" style="margin-top:20px;">
            <h3 class="report-sec-title">4. Leadership Responses & Feedback</h3>
            <div class="report-sec-content">
                <ul class="report-bullet-list">
                    ${leadershipResponseHtml}
                </ul>
            </div>
        </div>

        <!-- 5. What's being implemented -->
        <div class="report-section-divider" style="margin-top:20px;">
            <h3 class="report-sec-title">5. Projects Currently Being Implemented</h3>
            <div class="report-sec-content">
                <ul class="report-bullet-list">
                    ${implementingList}
                </ul>
            </div>
        </div>

        <!-- 6. Completed Improvements -->
        <div class="report-section-divider" style="margin-top:20px;">
            <h3 class="report-sec-title">6. Completed Improvements & Closed Requests</h3>
            <div class="report-sec-content">
                <ul class="report-bullet-list">
                    ${completedList}
                </ul>
            </div>
        </div>

        <!-- 7. What's next -->
        <div class="report-section-divider" style="margin-top:20px;">
            <h3 class="report-sec-title">7. Upcoming Priorities & Next Steps</h3>
            <div class="report-sec-content">
                <ul class="report-bullet-list">
                    ${whatsNextHtml}
                </ul>
            </div>
        </div>
    `;
}

// --- Admin Dashboard Operations Loading ---
function simulateAdminAccess() {
    openAdminAuthModal();
}

function openAdminAuthModal() {
    document.getElementById('admin-password-field').value = '';
    document.getElementById('admin-auth-error').classList.add('hidden');
    openModal('modal-admin-auth');
    setTimeout(() => {
        const field = document.getElementById('admin-password-field');
        if (field) field.focus();
    }, 150);
}

function closeAdminAuthModal() {
    closeModal('modal-admin-auth');
}

function handleAdminAuthSubmit(event) {
    event.preventDefault();
    const pw = document.getElementById('admin-password-field').value;
    if (pw === 'babyblue07') {
        closeModal('modal-admin-auth');
        document.getElementById('role-select').value = 'admin';
        handleRoleChange();
        switchTab('admin');
    } else {
        document.getElementById('admin-auth-error').classList.remove('hidden');
        document.getElementById('admin-password-field').value = '';
    }
}

function loadAdminPage() {
    const role = document.getElementById('role-select').value;
    const lockScreen = document.getElementById('admin-restricted-overlay');
    const adminLayout = document.getElementById('admin-dashboard-layout');

    if (role !== 'admin') {
        lockScreen.classList.remove('hidden');
        adminLayout.classList.remove('active');
        return;
    }

    lockScreen.classList.add('hidden');
    adminLayout.classList.add('active');

    // Load admin tables & forms
    loadAdminIssuesTable();
    populateMeetingNotesIrDropdowns();
    loadMeetingNotes();
    loadSOPChecklist();
    loadEmailBuilder();
    loadAdminPollsList();
    loadAdminVotersRegistry();
    loadAdminPollConnectSelect();
}

// Admin Tab 1: Issues table
function loadAdminIssuesTable() {
    const search = document.getElementById('admin-issues-search').value.toLowerCase();
    const cat = document.getElementById('admin-filter-category').value;
    const status = document.getElementById('admin-filter-status').value;
    const tbody = document.getElementById('admin-master-issues-rows');
    tbody.innerHTML = '';

    const filtered = issues.filter(ir => {
        const matchSearch = ir.irNumber.toLowerCase().includes(search) ||
                            ir.title.toLowerCase().includes(search) ||
                            ir.name.toLowerCase().includes(search) ||
                            ir.id.toLowerCase().includes(search);
        const matchCat = (cat === 'all') || (ir.category === cat);
        const matchStatus = (status === 'all') || (ir.status === status);
        return matchSearch && matchCat && matchStatus;
    });

    filtered.forEach(ir => {
        const dateStr = new Date(ir.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong class="font-mono">${ir.irNumber}</strong></td>
            <td><div style="font-weight:600; font-size:14.5px;">${ir.title}</div><small class="text-muted">${ir.description.substring(0, 50)}...</small></td>
            <td>${ir.category}</td>
            <td>
                ${ir.name || '—'}
                ${ir.isAnonymous ? '<span class="badge badge-accent" style="font-size:10px; margin-left:4px; padding:1px 5px;" title="Submitter requested anonymous display to peers">ANON</span>' : ''}
            </td>
            <td><span class="font-mono text-muted" style="font-size:12.5px;">${ir.id}</span></td>
            <td><span class="badge badge-priority-${ir.priority.toLowerCase()}">${ir.priority}</span></td>
            <td><span class="badge badge-status-${ir.status.toLowerCase().replace(/ /g, '-')}">${ir.status}</span></td>
            <td style="font-family:var(--font-mono); font-size:12px;">${ir.followUpDate ? new Date(ir.followUpDate).toLocaleDateString() : '—'}</td>
            <td>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn btn-xs btn-outline" onclick="openViewIssueModal('${ir.irNumber}')" title="View details">View</button>
                    <button class="btn btn-xs btn-primary" onclick="openManageIssueModal('${ir.irNumber}')" title="Edit request details">Edit</button>
                    <button class="btn btn-xs btn-danger" onclick="confirmDeleteIssue('${ir.irNumber}')" title="Delete request">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No matching requests found in database.</td></tr>';
    }
}

async function confirmDeleteIssue(irNumber) {
    const ir = issues.find(i => i.irNumber === irNumber);
    if (!ir) return;

    const confirmed = confirm(
        `Are you sure you want to permanently delete Issue Request ${ir.irNumber} ("${ir.title}")?\n\nThis will remove the request from both cloud and local records. This action cannot be undone.`
    );
    if (confirmed) {
        await deleteIssueRecord(irNumber);
        alert(`Issue Request ${irNumber} has been permanently deleted.`);
        loadAdminPage();
        refreshActivePage();
    }
}

// Helper: Escape HTML strings for safe rendering
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================================
// Admin Feature: Meeting Notes (Linked to Issue Requests & Discussions)
// ==========================================================================

function populateMeetingNotesIrDropdowns() {
    const filterSelect = document.getElementById('admin-filter-notes-ir');
    const modalSelect = document.getElementById('note-linked-ir');

    const filterVal = filterSelect ? filterSelect.value : 'all';
    const modalVal = modalSelect ? modalSelect.value : '';

    if (filterSelect) {
        filterSelect.innerHTML = `
            <option value="all">All Linked IRs & Discussions</option>
            <option value="GENERAL">General Discussions (No IR)</option>
        `;
        issues.forEach(ir => {
            const opt = document.createElement('option');
            opt.value = ir.irNumber;
            opt.textContent = `${ir.irNumber} — ${ir.title}`;
            filterSelect.appendChild(opt);
        });
        filterSelect.value = filterVal;
    }

    if (modalSelect) {
        modalSelect.innerHTML = `
            <option value="">-- Select Linked Issue Request --</option>
            <option value="GENERAL">General VC Committee Discussion (No Specific IR)</option>
        `;
        issues.forEach(ir => {
            const opt = document.createElement('option');
            opt.value = ir.irNumber;
            opt.textContent = `${ir.irNumber} — ${ir.title}`;
            modalSelect.appendChild(opt);
        });
        if (modalVal) modalSelect.value = modalVal;
    }
}

function loadMeetingNotes() {
    const container = document.getElementById('admin-meeting-notes-list');
    if (!container) return;

    const searchInput = document.getElementById('admin-notes-search');
    const filterSelect = document.getElementById('admin-filter-notes-ir');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterIr = filterSelect ? filterSelect.value : 'all';

    container.innerHTML = '';

    const filtered = meetingNotes.filter(n => {
        const matchesIr = (filterIr === 'all') || (n.irNumber === filterIr);
        const matchesQuery = !query ||
            (n.topic && n.topic.toLowerCase().includes(query)) ||
            (n.content && n.content.toLowerCase().includes(query)) ||
            (n.author && n.author.toLowerCase().includes(query)) ||
            (n.attendees && n.attendees.toLowerCase().includes(query)) ||
            (n.actionItems && n.actionItems.toLowerCase().includes(query)) ||
            (n.irNumber && n.irNumber.toLowerCase().includes(query));
        return matchesIr && matchesQuery;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-notes-placeholder" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: var(--bg-primary); border: 2px dashed var(--border-color); border-radius: var(--border-radius);">
                <div style="font-size: 32px; margin-bottom: 10px;">📝</div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--primary-color); margin-bottom: 6px;">No Meeting Notes Found</h4>
                <p class="text-muted" style="font-size: 13.5px; max-width: 480px; margin: 0 auto 16px auto;">
                    Document leadership discussions, committee deliberations, or link notes directly to specific Issue Requests to keep all VC members aligned.
                </p>
                <button type="button" class="btn btn-primary" onclick="openMeetingNoteModal()">+ Add Your First Note</button>
            </div>
        `;
        return;
    }

    filtered.forEach(note => {
        const linkedIr = issues.find(i => i.irNumber === note.irNumber);
        let linkedBadgeHtml = '';
        if (note.irNumber === 'GENERAL' || !note.irNumber) {
            linkedBadgeHtml = `<span class="note-badge-ir general">General Discussion</span>`;
        } else {
            const irTitle = linkedIr ? linkedIr.title : 'Linked Issue';
            linkedBadgeHtml = `<span class="note-badge-ir" onclick="openViewIssueModal('${note.irNumber}')" title="Click to view details for ${note.irNumber}">🔗 ${note.irNumber}: ${escapeHtml(irTitle.substring(0, 32))}${irTitle.length > 32 ? '...' : ''}</span>`;
        }

        const dateStr = note.date ? new Date(note.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

        const card = document.createElement('div');
        card.className = 'meeting-note-card';
        card.innerHTML = `
            <div class="meeting-note-card-header">
                <div class="note-meta-badges">
                    <span class="note-badge-date">📅 ${dateStr}</span>
                    ${linkedBadgeHtml}
                    <span class="note-badge-author">✍️ ${escapeHtml(note.author || 'VC Rep')}</span>
                </div>
                <div class="note-actions-btn-group">
                    <button class="btn btn-xs btn-outline" onclick="openMeetingNoteModal('${note.id}')" title="Edit note">Edit</button>
                    <button class="btn btn-xs btn-danger" onclick="confirmDeleteMeetingNote('${note.id}')" title="Delete note">Delete</button>
                </div>
            </div>

            <h4 class="note-topic-title">${escapeHtml(note.topic)}</h4>

            ${note.attendees ? `
                <div class="note-attendees-row">
                    <strong>Participants:</strong> ${escapeHtml(note.attendees)}
                </div>
            ` : ''}

            <div class="note-content-body">
                ${escapeHtml(note.content).replace(/\n/g, '<br>')}
            </div>

            ${note.actionItems ? `
                <div class="note-actions-callout">
                    <div class="note-actions-label">⚡ Next Steps & Action Items:</div>
                    <div>${escapeHtml(note.actionItems).replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

function openMeetingNoteModal(noteId = null) {
    populateMeetingNotesIrDropdowns();
    const form = document.getElementById('admin-meeting-note-form');
    if (!form) return;

    if (noteId) {
        const note = meetingNotes.find(n => n.id === noteId);
        if (!note) return;
        document.getElementById('modal-note-title').textContent = 'Edit Committee Meeting Note';
        document.getElementById('note-id').value = note.id;
        document.getElementById('note-linked-ir').value = note.irNumber || 'GENERAL';
        document.getElementById('note-date').value = note.date || '';
        document.getElementById('note-author').value = note.author || '';
        document.getElementById('note-topic').value = note.topic || '';
        document.getElementById('note-attendees').value = note.attendees || '';
        document.getElementById('note-content').value = note.content || '';
        document.getElementById('note-actions').value = note.actionItems || '';
    } else {
        document.getElementById('modal-note-title').textContent = 'Add Committee Meeting Note';
        form.reset();
        document.getElementById('note-id').value = '';
        document.getElementById('note-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('note-author').value = 'JFK OPS AVC Rep';
    }

    openModal('modal-meeting-note');
}

async function handleMeetingNoteSave(event) {
    event.preventDefault();

    const noteId = document.getElementById('note-id').value.trim() || `NOTE-${Date.now()}`;
    const irNumber = document.getElementById('note-linked-ir').value;
    const date = document.getElementById('note-date').value;
    const author = document.getElementById('note-author').value.trim();
    const topic = document.getElementById('note-topic').value.trim();
    const attendees = document.getElementById('note-attendees').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const actionItems = document.getElementById('note-actions').value.trim();

    const noteObj = {
        id: noteId,
        irNumber: irNumber,
        date: date,
        author: author,
        topic: topic,
        attendees: attendees,
        content: content,
        actionItems: actionItems,
        updatedAt: new Date().toISOString()
    };

    await saveMeetingNoteRecord(noteObj);
    closeModal('modal-meeting-note');
    loadMeetingNotes();
}

async function confirmDeleteMeetingNote(noteId) {
    const note = meetingNotes.find(n => n.id === noteId);
    if (!note) return;

    if (confirm(`Are you sure you want to delete this meeting note ("${note.topic}")?`)) {
        await deleteMeetingNoteRecord(noteId);
        loadMeetingNotes();
    }
}

// ==========================================================================
// Admin Feature: Ops SOP & Post-Meeting Execution Checklist
// ==========================================================================
function loadSOPChecklist() {
    renderSOPChecklist();
}

function renderSOPChecklist() {
    const container = document.getElementById('sop-checklist-items-list');
    if (!container) return;

    if (!sopChecklist || sopChecklist.length === 0) {
        sopChecklist = JSON.parse(JSON.stringify(DEFAULT_SOP_CHECKLIST));
        saveSOPChecklistToStorage(false);
    }

    let completedCount = 0;
    container.innerHTML = '';

    sopChecklist.forEach((item) => {
        if (item.completed) completedCount++;

        const itemEl = document.createElement('div');
        itemEl.className = `sop-checklist-item ${item.completed ? 'is-completed' : ''}`;
        itemEl.id = `sop-row-${item.id}`;

        let timestampHtml = '';
        if (item.completed && item.completedAt) {
            const dateObj = new Date(item.completedAt);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            timestampHtml = `<span class="sop-item-timestamp">✓ Completed on ${dateStr}, ${timeStr}</span>`;
        }

        let actionBtnHtml = '';
        if (item.actionTarget) {
            actionBtnHtml = `<button type="button" class="btn btn-outline btn-xs sop-item-action-btn" onclick="switchAdminSubTab('${item.actionTarget}')">${escapeHtml(item.actionLabel)} →</button>`;
        }

        itemEl.innerHTML = `
            <div class="sop-item-checkbox-wrapper">
                <input type="checkbox" class="sop-item-checkbox" id="check-${item.id}" data-step-id="${item.id}" ${item.completed ? 'checked' : ''} aria-label="${escapeHtml(item.title)}">
            </div>
            <div class="sop-item-body">
                <div class="sop-item-header">
                    <span class="sop-step-pill">Step ${String(item.step).padStart(2, '0')}</span>
                    <span class="sop-timeline-pill">⏱️ ${escapeHtml(item.phase)}</span>
                    <span class="sop-owner-pill">👤 ${escapeHtml(item.owner)}</span>
                </div>
                <label for="check-${item.id}" class="sop-item-title">${escapeHtml(item.title)}</label>
                <p class="sop-item-desc">${escapeHtml(item.description)}</p>
                <div class="sop-item-footer">
                    <div>${timestampHtml}</div>
                    <div>${actionBtnHtml}</div>
                </div>
            </div>
        `;

        const checkbox = itemEl.querySelector('.sop-item-checkbox');
        checkbox.addEventListener('change', (e) => {
            toggleSOPChecklistStep(item.id, e.target.checked);
        });

        container.appendChild(itemEl);
    });

    // Update Progress Metrics
    const totalCount = sopChecklist.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const progressFill = document.getElementById('sop-progress-fill');
    if (progressFill) progressFill.style.width = `${percent}%`;

    const percentText = document.getElementById('sop-progress-percent-text');
    if (percentText) {
        percentText.textContent = `${percent}% Completed (${completedCount} of ${totalCount})`;
    }

    const counterBadge = document.getElementById('sop-checklist-counter-badge');
    if (counterBadge) {
        counterBadge.textContent = `${completedCount} / ${totalCount} Completed (${percent}%)`;
        counterBadge.className = 'badge';
        if (completedCount === totalCount) {
            counterBadge.classList.add('badge-success');
        } else if (completedCount > 0) {
            counterBadge.classList.add('badge-accent');
        } else {
            counterBadge.classList.add('badge-outline');
        }
    }

    // Update Phase Indicator states
    updatePhaseIndicators();
}

function updatePhaseIndicators() {
    const isStepCompleted = (stepNum) => {
        const it = sopChecklist.find(i => i.step === stepNum);
        return it ? it.completed : false;
    };

    // Phase 1: Days 1-2 (Steps 1, 2, 3)
    const p1 = document.getElementById('phase-ind-1');
    if (p1) {
        const done = isStepCompleted(1) && isStepCompleted(2) && isStepCompleted(3);
        const active = !done && (isStepCompleted(1) || isStepCompleted(2));
        p1.classList.toggle('active', active || done);
        p1.style.borderColor = done ? '#10b981' : '';
    }

    // Phase 2: Days 2-3 (Steps 4, 5, 6)
    const p2 = document.getElementById('phase-ind-2');
    if (p2) {
        const done = isStepCompleted(4) && isStepCompleted(5) && isStepCompleted(6);
        const active = !done && (isStepCompleted(4) || isStepCompleted(5));
        p2.classList.toggle('active', active || done);
        p2.style.borderColor = done ? '#10b981' : '';
    }

    // Phase 3: Days 3-5 (Step 7)
    const p3 = document.getElementById('phase-ind-3');
    if (p3) {
        const done = isStepCompleted(7);
        p3.classList.toggle('active', done);
        p3.style.borderColor = done ? '#10b981' : '';
    }

    // Phase 4: Days 5-7 (Step 8)
    const p4 = document.getElementById('phase-ind-4');
    if (p4) {
        const done = isStepCompleted(8);
        p4.classList.toggle('active', done);
        p4.style.borderColor = done ? '#10b981' : '';
    }

    // Phase 5: Days 7-10 (Steps 9, 10)
    const p5 = document.getElementById('phase-ind-5');
    if (p5) {
        const done = isStepCompleted(9) && isStepCompleted(10);
        const active = !done && isStepCompleted(9);
        p5.classList.toggle('active', active || done);
        p5.style.borderColor = done ? '#10b981' : '';
    }
}

function toggleSOPChecklistStep(stepId, isChecked) {
    const item = sopChecklist.find(i => i.id === stepId);
    if (item) {
        item.completed = isChecked;
        item.completedAt = isChecked ? new Date().toISOString() : null;
        saveSOPChecklistToStorage();
        renderSOPChecklist();
    }
}

function handleResetSOPChecklist() {
    if (confirm("Reset the Post-Meeting Execution Checklist for a new monthly cycle? This will uncheck all 10 tasks so you can begin tracking the next month fresh.")) {
        sopChecklist.forEach(item => {
            item.completed = false;
            item.completedAt = null;
        });
        saveSOPChecklistToStorage();
        renderSOPChecklist();
    }
}

function handleMarkAllSOPChecklist() {
    const nowIso = new Date().toISOString();
    sopChecklist.forEach(item => {
        item.completed = true;
        if (!item.completedAt) item.completedAt = nowIso;
    });
    saveSOPChecklistToStorage();
    renderSOPChecklist();
}

// ==========================================================================
// Admin Feature: Email Builder Template System
// ==========================================================================
let activeEmailTemplate = 'special-notice';
let currentEmailSubject = '';
let currentEmailPlainText = '';
let currentEmailHtml = '';

function loadEmailBuilder() {
    populateEmailIrDropdown();
    switchEmailTemplate(activeEmailTemplate);
}

function populateEmailIrDropdown() {
    const select = document.getElementById('email-ir-select');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select IR to Auto-Fill Fields --</option>';
    issues.forEach(ir => {
        const opt = document.createElement('option');
        opt.value = ir.irNumber;
        opt.textContent = `${ir.irNumber} — ${ir.title}`;
        select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
}

function switchEmailTemplate(tplKey) {
    activeEmailTemplate = tplKey;

    // Update active tab buttons
    document.querySelectorAll('.email-tpl-btn').forEach(btn => {
        if (btn.getAttribute('data-tpl') === tplKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update preview mode badge
    const badge = document.getElementById('email-preview-mode-badge');
    if (badge) {
        if (tplKey === 'special-notice') {
            badge.textContent = 'Special Notice';
        } else if (tplKey === 'monthly-update') {
            badge.textContent = 'Monthly Update';
        } else {
            badge.textContent = 'Custom Canvas';
        }
    }

    renderEmailFormFields(tplKey);
    updateEmailPreview();
}

function renderEmailFormFields(tplKey) {
    const container = document.getElementById('email-form-fields-container');
    if (!container) return;

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const monthYearStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (tplKey === 'special-notice') {
        container.innerHTML = `
            <div class="form-group">
                <label for="email-sn-topic">Notice Topic / Issue Subject <span class="required">*</span></label>
                <input type="text" id="email-sn-topic" value="AM-PM Rest Window Compliance & Station Support" placeholder="e.g. Peak Operational Staffing, Rest Windows">
            </div>

            <div class="form-grid-2col">
                <div class="form-group">
                    <label for="email-sn-date">Meeting / Notice Date <span class="required">*</span></label>
                    <input type="text" id="email-sn-date" value="${todayStr}">
                </div>
                <div class="form-group">
                    <label for="email-sn-greeting">Salutation</label>
                    <input type="text" id="email-sn-greeting" value="Good Day JFK OPS Coordinators,">
                </div>
            </div>

            <div class="form-group">
                <label for="email-sn-intro">Intro Statement</label>
                <textarea id="email-sn-intro" rows="2">The Operations Values Committee (AVC) recently met with Station Operations Leadership to address coordinator feedback and discuss actionable solutions.</textarea>
            </div>

            <div class="form-group">
                <label for="email-sn-update">1. What's the Update? (Context & What Happened) <span class="required">*</span></label>
                <textarea id="email-sn-update" rows="3" placeholder="Provide background and context of the leadership discussion...">Coordinators raised concerns regarding extended peak departure windows and consecutive shift coverage. The committee presented operational data gathered from frontline shifts to highlight the necessity of structured rest intervals.</textarea>
            </div>

            <div class="form-group">
                <label for="email-sn-response">2. Leadership Response / Operational Decision <span class="required">*</span></label>
                <textarea id="email-sn-response" rows="3" placeholder="Explain leadership's formal response or agreement...">Leadership acknowledged the impact on coordination tempo and committed to enforcing mandatory relief rotation during peak bank hours, with additional supervisory floor presence on high-volume days.</textarea>
            </div>

            <div class="form-group">
                <label for="email-sn-impact">3. What This Means for OPS Coordinators <span class="required">*</span></label>
                <textarea id="email-sn-impact" rows="3" placeholder="Outline specific impact to daily work or coordinator shifts...">Coordinators will receive assigned relief windows during 4+ hour operational stretches. Coordinators should flag any unassigned relief coverage directly to the shift lead and AVC representative.</textarea>
            </div>

            <div class="form-group">
                <label for="email-sn-next">4. Next Steps & Timeline <span class="required">*</span></label>
                <textarea id="email-sn-next" rows="2" placeholder="Next check-in, follow-up timeline, or review milestones...">A two-week evaluation period begins immediately. AVC will sync with Station Leadership on the 1st of next month to review compliance and coordinator feedback.</textarea>
            </div>

            <div class="form-group">
                <label for="email-sn-cta">Stay Informed & Engaged Note</label>
                <textarea id="email-sn-cta" rows="2">If you have additional questions or observations regarding this update, connect with your AVC representatives or submit feedback via the JFK OPS AVC System.</textarea>
            </div>

            <div class="form-group">
                <label for="email-sn-signoff">Committee Sign-off</label>
                <textarea id="email-sn-signoff" rows="3">Same Crew. Higher Standards.
Operations Values Committee (AVC)
JFK Terminal 5 | JetBlue Airways</textarea>
            </div>
        `;
    } else if (tplKey === 'monthly-update') {
        const curYr = new Date().getFullYear();
        container.innerHTML = `
            <div class="form-grid-2col">
                <div class="form-group">
                    <label for="email-mu-period">Update Month / Period <span class="required">*</span></label>
                    <input type="text" id="email-mu-period" list="email-periods-list" value="${monthYearStr}" placeholder="e.g. ${monthYearStr}, Q1 ${curYr}">
                    <datalist id="email-periods-list">
                        <option value="${monthYearStr}">
                        <option value="Q1 ${curYr}">
                        <option value="Q2 ${curYr}">
                        <option value="Q3 ${curYr}">
                        <option value="Q4 ${curYr}">
                        <option value="Q1 ${curYr + 1}">
                        <option value="Q2 ${curYr + 1}">
                        <option value="Q3 ${curYr + 1}">
                        <option value="Q4 ${curYr + 1}">
                    </datalist>
                </div>
                <div class="form-group">
                    <label for="email-mu-greeting">Salutation</label>
                    <input type="text" id="email-mu-greeting" value="Hello JFK OPS Coordinators,">
                </div>
            </div>

            <div class="form-group">
                <label for="email-mu-intro">Intro Statement</label>
                <textarea id="email-mu-intro" rows="3">Here is your monthly update from the Operations Values Committee (AVC). Our role is to ensure coordinator concerns, ideas, and operational priorities are directly represented in discussions with leadership.

Here is a summary of what we addressed this past month:</textarea>
            </div>

            <div class="form-group">
                <label for="email-mu-discussed">1. What We Discussed <span class="required">*</span></label>
                <textarea id="email-mu-discussed" rows="3" placeholder="• Topic 1&#10;• Topic 2">• AM-PM Rest Window Compliance & Station Support
• Coordinator Workload Balancing during Severe Weather Irregular Operations
• Operations Desk Radio & Dual-Monitor Replacement Requests</textarea>
            </div>

            <div class="form-group">
                <label for="email-mu-responses">2. Leadership Updates & Responses <span class="required">*</span></label>
                <textarea id="email-mu-responses" rows="3" placeholder="• Outcome 1&#10;• Outcome 2">• Station Director approved revised peak relief rotation protocol.
• IT procurement confirmed replacement headsets and monitors arriving before month-end.</textarea>
            </div>

            <div class="form-group">
                <label for="email-mu-progress">3. Progress & Completed Items</label>
                <textarea id="email-mu-progress" rows="3" placeholder="• Completed item 1">• Standardized Shift Hand-off checklist rolled out across all coordinator consoles.
• Bi-weekly check-ins established between AVC Leads and Duty Managers.</textarea>
            </div>

            <div class="form-group">
                <label for="email-mu-next">4. What's Next?</label>
                <textarea id="email-mu-next" rows="2" placeholder="• Next focus areas">• Monthly leadership review scheduled for next week to evaluate IAT training timeline and upcoming holiday staffing buffers.</textarea>
            </div>

            <div class="form-group">
                <label for="email-mu-cta">5. Your Voice Matters (Call-to-Action)</label>
                <textarea id="email-mu-cta" rows="2">Have a concern or suggestion? Submit an Issue Request or participate in active coordinator votes on the JFK OPS AVC System.

Thank you for your dedication to safe and reliable operations every day.</textarea>
            </div>

            <div class="form-group">
                <label for="email-mu-signoff">Committee Sign-off</label>
                <textarea id="email-mu-signoff" rows="3">Same Crew. Higher Standards.
Operations Values Committee (AVC)
JFK Terminal 5 | JetBlue Airways</textarea>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="form-group">
                <label for="email-cc-subject">Email Subject Line <span class="required">*</span></label>
                <input type="text" id="email-cc-subject" value="JFK OPS AVC | Operational Update" placeholder="Subject for coordinators and leadership">
            </div>

            <div class="form-group">
                <label for="email-cc-title">Announcement Headline / Banner <span class="required">*</span></label>
                <input type="text" id="email-cc-title" value="IMPORTANT OPERATIONAL ANNOUNCEMENT" placeholder="Main headline">
            </div>

            <div class="form-grid-2col">
                <div class="form-group">
                    <label for="email-cc-date">Date</label>
                    <input type="text" id="email-cc-date" value="${todayStr}">
                </div>
                <div class="form-group">
                    <label for="email-cc-greeting">Salutation</label>
                    <input type="text" id="email-cc-greeting" value="Good Day JFK OPS Coordinators,">
                </div>
            </div>

            <div class="form-group">
                <label for="email-cc-body">Message Body (Blank Canvas) <span class="required">*</span></label>
                <textarea id="email-cc-body" rows="6" placeholder="Write your custom communication or update here...">Please review the following operational advisory regarding coordinator workflows and upcoming station procedures.</textarea>
            </div>

            <div class="form-group">
                <label for="email-cc-action">Action Items / Call to Action (Optional)</label>
                <textarea id="email-cc-action" rows="2" placeholder="Specific action items for coordinators or leadership...">Please reach out to your shift AVC representative with any operational feedback or questions.</textarea>
            </div>

            <div class="form-group">
                <label for="email-cc-signoff">Signature & Sign-off</label>
                <textarea id="email-cc-signoff" rows="3">Same Crew. Higher Standards.
Operations Values Committee (AVC)
JFK Terminal 5 | JetBlue Airways</textarea>
            </div>
        `;
    }

    // Attach input event listeners on all inputs inside the form for real-time preview
    container.querySelectorAll('input, textarea').forEach(elem => {
        elem.addEventListener('input', updateEmailPreview);
    });
}

function updateEmailPreview() {
    const subjectElem = document.getElementById('email-preview-subject-text');
    const bodyElem = document.getElementById('email-preview-rendered-body');
    if (!bodyElem) return;

    if (activeEmailTemplate === 'special-notice') {
        const topic = document.getElementById('email-sn-topic')?.value || 'Special Notice';
        const date = document.getElementById('email-sn-date')?.value || '';
        const greeting = document.getElementById('email-sn-greeting')?.value || '';
        const intro = document.getElementById('email-sn-intro')?.value || '';
        const update = document.getElementById('email-sn-update')?.value || '';
        const response = document.getElementById('email-sn-response')?.value || '';
        const impact = document.getElementById('email-sn-impact')?.value || '';
        const next = document.getElementById('email-sn-next')?.value || '';
        const cta = document.getElementById('email-sn-cta')?.value || '';
        const signoff = document.getElementById('email-sn-signoff')?.value || '';

        currentEmailSubject = `JFK OPS AVC × Leadership | Special Notice — ${topic}`;
        if (subjectElem) subjectElem.textContent = currentEmailSubject;

        // Plain Text Representation
        currentEmailPlainText = `JFK OPS AVC × LEADERSHIP | SPECIAL NOTICE
${date}
----------------------------------------------------------------------
${greeting}

${intro}

WHAT'S THE UPDATE?
${update}

LEADERSHIP'S RESPONSE / DECISION
${response}

WHAT THIS MEANS FOR OPS COORDINATORS
${impact}

NEXT STEPS
${next}

STAY INFORMED & ENGAGED
${cta}

----------------------------------------------------------------------
${signoff}`;

        // Rich HTML Representation
        currentEmailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1c2430; line-height: 1.6;">
                <div style="background: #00205B; color: #ffffff; padding: 22px 24px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #00A3E0;">
                    <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #00A3E0; font-weight: 700;">JetBlue Airways • JFK Terminal 5</div>
                    <h2 style="margin: 6px 0 2px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">JFK OPS AVC × LEADERSHIP | SPECIAL NOTICE</h2>
                    <div style="font-size: 13px; color: #cbd5e1; font-weight: 500;">${escapeHtml(date)}</div>
                </div>
                <div style="background: #ffffff; padding: 26px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; font-weight: 600; color: #00205B; margin-top: 0;">${escapeHtml(greeting)}</p>
                    <p style="font-size: 14px; color: #334155;">${escapeHtml(intro)}</p>

                    <div style="margin: 20px 0;">
                        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; font-weight: 800;">
                            What's the Update?
                        </h3>
                        <p style="font-size: 14px; color: #334155; margin: 0;">${escapeHtml(update).replace(/\n/g, '<br>')}</p>
                    </div>

                    <div style="margin: 20px 0; background: #f0f7ff; border-left: 4px solid #0033A0; padding: 14px 16px; border-radius: 0 6px 6px 0;">
                        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; margin: 0 0 6px 0; font-weight: 800;">
                            Leadership's Response / Decision
                        </h3>
                        <p style="font-size: 14px; color: #1e3a8a; margin: 0;">${escapeHtml(response).replace(/\n/g, '<br>')}</p>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; font-weight: 800;">
                            What This Means for OPS Coordinators
                        </h3>
                        <p style="font-size: 14px; color: #334155; margin: 0;">${escapeHtml(impact).replace(/\n/g, '<br>')}</p>
                    </div>

                    <div style="margin: 20px 0; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 6px 6px 0;">
                        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #92400e; margin: 0 0 6px 0; font-weight: 800;">
                            Next Steps & Timeline
                        </h3>
                        <p style="font-size: 14px; color: #78350f; margin: 0;">${escapeHtml(next).replace(/\n/g, '<br>')}</p>
                    </div>

                    <div style="margin: 20px 0; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                        <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin-bottom: 6px;">Stay Informed & Engaged</h4>
                        <p style="font-size: 13.5px; color: #475569; margin: 0;">${escapeHtml(cta).replace(/\n/g, '<br>')}</p>
                    </div>

                    <div style="margin-top: 28px; padding-top: 16px; border-top: 2px solid #00205B; color: #00205B;">
                        <div style="font-weight: 800; font-style: italic; font-size: 15px; color: #0033A0;">Same Crew. Higher Standards.</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">Operations Values Committee (AVC)</div>
                        <div style="font-size: 12px; color: #64748b;">JFK Terminal 5 | JetBlue Airways</div>
                    </div>
                </div>
            </div>
        `;

        bodyElem.innerHTML = currentEmailHtml;

    } else if (activeEmailTemplate === 'monthly-update') {
        const period = document.getElementById('email-mu-period')?.value || '';
        const greeting = document.getElementById('email-mu-greeting')?.value || '';
        const intro = document.getElementById('email-mu-intro')?.value || '';
        const discussed = document.getElementById('email-mu-discussed')?.value || '';
        const responses = document.getElementById('email-mu-responses')?.value || '';
        const progress = document.getElementById('email-mu-progress')?.value || '';
        const next = document.getElementById('email-mu-next')?.value || '';
        const cta = document.getElementById('email-mu-cta')?.value || '';
        const signoff = document.getElementById('email-mu-signoff')?.value || '';

        currentEmailSubject = `JFK OPS AVC | Monthly Department Update — ${period}`;
        if (subjectElem) subjectElem.textContent = currentEmailSubject;

        currentEmailPlainText = `JFK OPS AVC | MONTHLY DEPARTMENT UPDATE
${period}
----------------------------------------------------------------------
${greeting}

${intro}

1. WHAT WE DISCUSSED
${discussed}

2. LEADERSHIP UPDATES & RESPONSES
${responses}

3. PROGRESS & COMPLETED ITEMS
${progress}

4. WHAT'S NEXT?
${next}

5. YOUR VOICE MATTERS
${cta}

----------------------------------------------------------------------
${signoff}`;

        currentEmailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1c2430; line-height: 1.6;">
                <div style="background: #00205B; color: #ffffff; padding: 22px 24px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #00A3E0;">
                    <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #00A3E0; font-weight: 700;">JetBlue Airways • JFK Terminal 5</div>
                    <h2 style="margin: 6px 0 2px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">JFK OPS AVC | MONTHLY DEPARTMENT UPDATE</h2>
                    <div style="font-size: 13px; color: #cbd5e1; font-weight: 500;">${escapeHtml(period)}</div>
                </div>
                <div style="background: #ffffff; padding: 26px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; font-weight: 600; color: #00205B; margin-top: 0;">${escapeHtml(greeting)}</p>
                    <p style="font-size: 14px; color: #334155;">${escapeHtml(intro).replace(/\n/g, '<br>')}</p>

                    <div style="margin: 22px 0;">
                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800;">
                            1. What We Discussed
                        </h3>
                        <div style="font-size: 14px; color: #334155; line-height: 1.7;">${escapeHtml(discussed).replace(/\n/g, '<br>')}</div>
                    </div>

                    <div style="margin: 22px 0; background: #f0f7ff; border-left: 4px solid #0033A0; padding: 14px 16px; border-radius: 0 6px 6px 0;">
                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; margin: 0 0 8px 0; font-weight: 800;">
                            2. Leadership Updates & Responses
                        </h3>
                        <div style="font-size: 14px; color: #1e3a8a; line-height: 1.7;">${escapeHtml(responses).replace(/\n/g, '<br>')}</div>
                    </div>

                    <div style="margin: 22px 0; background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 6px 6px 0;">
                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #065f46; margin: 0 0 8px 0; font-weight: 800;">
                            3. Progress & Completed Items
                        </h3>
                        <div style="font-size: 14px; color: #047857; line-height: 1.7;">${escapeHtml(progress).replace(/\n/g, '<br>')}</div>
                    </div>

                    <div style="margin: 22px 0;">
                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800;">
                            4. What's Next?
                        </h3>
                        <div style="font-size: 14px; color: #334155; line-height: 1.7;">${escapeHtml(next).replace(/\n/g, '<br>')}</div>
                    </div>

                    <div style="margin: 22px 0; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; margin-bottom: 8px; font-weight: 800;">
                            5. Your Voice Matters
                        </h3>
                        <div style="font-size: 14px; color: #475569; line-height: 1.7;">${escapeHtml(cta).replace(/\n/g, '<br>')}</div>
                    </div>

                    <div style="margin-top: 28px; padding-top: 16px; border-top: 2px solid #00205B; color: #00205B;">
                        <div style="font-weight: 800; font-style: italic; font-size: 15px; color: #0033A0;">Same Crew. Higher Standards.</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">Operations Values Committee (AVC)</div>
                        <div style="font-size: 12px; color: #64748b;">JFK Terminal 5 | JetBlue Airways</div>
                    </div>
                </div>
            </div>
        `;

        bodyElem.innerHTML = currentEmailHtml;

    } else {
        const subject = document.getElementById('email-cc-subject')?.value || 'AVC Announcement';
        const title = document.getElementById('email-cc-title')?.value || 'OPERATIONAL UPDATE';
        const date = document.getElementById('email-cc-date')?.value || '';
        const greeting = document.getElementById('email-cc-greeting')?.value || '';
        const body = document.getElementById('email-cc-body')?.value || '';
        const action = document.getElementById('email-cc-action')?.value || '';
        const signoff = document.getElementById('email-cc-signoff')?.value || '';

        currentEmailSubject = subject;
        if (subjectElem) subjectElem.textContent = currentEmailSubject;

        currentEmailPlainText = `${title}
${date}
----------------------------------------------------------------------
${greeting}

${body}

${action ? `NEXT STEPS / ACTION:\n${action}\n` : ''}
----------------------------------------------------------------------
${signoff}`;

        currentEmailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1c2430; line-height: 1.6;">
                <div style="background: #00205B; color: #ffffff; padding: 22px 24px; border-radius: 8px 8px 0 0; border-bottom: 4px solid #00A3E0;">
                    <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #00A3E0; font-weight: 700;">JetBlue Airways • JFK Terminal 5</div>
                    <h2 style="margin: 6px 0 2px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">${escapeHtml(title)}</h2>
                    <div style="font-size: 13px; color: #cbd5e1; font-weight: 500;">${escapeHtml(date)}</div>
                </div>
                <div style="background: #ffffff; padding: 26px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; font-weight: 600; color: #00205B; margin-top: 0;">${escapeHtml(greeting)}</p>
                    <div style="font-size: 14px; color: #334155; line-height: 1.7; margin: 18px 0;">
                        ${escapeHtml(body).replace(/\n/g, '<br>')}
                    </div>

                    ${action ? `
                        <div style="margin: 22px 0; background: #f0f7ff; border-left: 4px solid #0033A0; padding: 14px 16px; border-radius: 0 6px 6px 0;">
                            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #00205B; margin: 0 0 6px 0; font-weight: 800;">
                                Next Steps & Action Items
                            </h3>
                            <p style="font-size: 14px; color: #1e3a8a; margin: 0;">${escapeHtml(action).replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}

                    <div style="margin-top: 28px; padding-top: 16px; border-top: 2px solid #00205B; color: #00205B;">
                        <div style="font-weight: 800; font-style: italic; font-size: 15px; color: #0033A0;">Same Crew. Higher Standards.</div>
                        <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">Operations Values Committee (AVC)</div>
                        <div style="font-size: 12px; color: #64748b;">JFK Terminal 5 | JetBlue Airways</div>
                    </div>
                </div>
            </div>
        `;

        bodyElem.innerHTML = currentEmailHtml;
    }
}

function applySelectedIrToEmail() {
    const select = document.getElementById('email-ir-select');
    if (!select || !select.value) {
        alert("Please select an Issue Request from the dropdown to import.");
        return;
    }

    const ir = issues.find(i => i.irNumber === select.value);
    if (!ir) return;

    if (activeEmailTemplate === 'special-notice') {
        const topicInput = document.getElementById('email-sn-topic');
        const updateInput = document.getElementById('email-sn-update');
        const responseInput = document.getElementById('email-sn-response');
        const impactInput = document.getElementById('email-sn-impact');
        const nextInput = document.getElementById('email-sn-next');

        if (topicInput) topicInput.value = `[${ir.irNumber}] ${ir.title}`;
        if (updateInput) updateInput.value = `The Operations Values Committee (AVC) reviewed request ${ir.irNumber} regarding "${ir.title}".\n\nBackground: ${ir.description}${ir.impact ? '\n\nOperational Impact: ' + ir.impact : ''}`;
        if (responseInput) responseInput.value = ir.leadershipResponse || ir.decisionSummary || 'Leadership is currently reviewing this request with station operations.';
        if (impactInput) impactInput.value = ir.proposedSolution || ir.solution || 'Coordinators are advised to continue standard operating procedures while follow-ups are underway.';
        if (nextInput) nextInput.value = `Next tactical action: ${ir.nextAction || 'Follow up with leadership'}. Target date: ${ir.followUpDate || 'TBD'}.`;

    } else if (activeEmailTemplate === 'monthly-update') {
        const discussedInput = document.getElementById('email-mu-discussed');
        const responseInput = document.getElementById('email-mu-responses');

        if (discussedInput) {
            discussedInput.value += `\n• [${ir.irNumber}] ${ir.title}`;
        }
        if (responseInput && ir.leadershipResponse) {
            responseInput.value += `\n• ${ir.irNumber}: ${ir.leadershipResponse}`;
        }

    } else {
        const subjectInput = document.getElementById('email-cc-subject');
        const titleInput = document.getElementById('email-cc-title');
        const bodyInput = document.getElementById('email-cc-body');
        const actionInput = document.getElementById('email-cc-action');

        if (subjectInput) subjectInput.value = `JFK OPS AVC | ${ir.irNumber}: ${ir.title}`;
        if (titleInput) titleInput.value = `UPDATE: ${ir.irNumber} — ${ir.title}`;
        if (bodyInput) bodyInput.value = `Issue Description:\n${ir.description}\n\nLeadership Stance / Response:\n${ir.leadershipResponse || 'In review with station management.'}`;
        if (actionInput) actionInput.value = `Target follow-up: ${ir.followUpDate || 'Ongoing'}. Next action: ${ir.nextAction || 'None specified.'}`;
    }

    updateEmailPreview();
}

async function copyEmailText() {
    if (!currentEmailPlainText) updateEmailPreview();
    const btn = document.getElementById('btn-copy-email-text');
    try {
        await navigator.clipboard.writeText(currentEmailPlainText);
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Copied Plain Text!';
            setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
    } catch (err) {
        console.error("Failed to copy plain text:", err);
        alert("Clipboard copy failed. Please select text manually.");
    }
}

async function copyEmailHtml() {
    if (!currentEmailHtml) updateEmailPreview();
    const btn = document.getElementById('btn-copy-email-html');
    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const htmlBlob = new Blob([currentEmailHtml], { type: 'text/html' });
            const textBlob = new Blob([currentEmailPlainText], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);
        } else {
            await navigator.clipboard.writeText(currentEmailHtml);
        }
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Copied Rich HTML!';
            setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
    } catch (err) {
        console.warn("Direct HTML copy failed, falling back to text copy:", err);
        try {
            await navigator.clipboard.writeText(currentEmailPlainText);
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '✅ Copied as Text!';
                setTimeout(() => { btn.innerHTML = original; }, 2000);
            }
        } catch (e2) {
            alert("Clipboard copy failed.");
        }
    }
}

// Admin Tab 2: Create Poll connected IR select
function loadAdminPollConnectSelect() {
    const select = document.getElementById('poll-connect-ir');
    select.innerHTML = '<option value="">-- Do Not Connect to IR --</option>';
    
    // Add issues suitable for voting (exclude completed/archived)
    issues.forEach(ir => {
        if (ir.status !== 'COMPLETED' && ir.status !== 'ARCHIVED') {
            const opt = document.createElement('option');
            opt.value = ir.irNumber;
            opt.textContent = `${ir.irNumber} - ${ir.title}`;
            select.appendChild(opt);
        }
    });
}

async function handleCreatePoll(event) {
    event.preventDefault();

    const connectedIr = document.getElementById('poll-connect-ir').value;
    const title = document.getElementById('poll-title').value.trim();
    const description = document.getElementById('poll-description').value.trim();
    const opt1 = document.getElementById('poll-opt1-title').value.trim();
    const opt1Desc = document.getElementById('poll-opt1-desc').value.trim();
    const opt2 = document.getElementById('poll-opt2-title').value.trim();
    const opt2Desc = document.getElementById('poll-opt2-desc').value.trim();
    const opt3 = document.getElementById('poll-opt3-title').value.trim();
    const opt3Desc = document.getElementById('poll-opt3-desc').value.trim();
    const openDate = document.getElementById('poll-open-date').value;
    const closeDate = document.getElementById('poll-close-date').value;
    const eligibleVoters = parseInt(document.getElementById('poll-eligible-voters').value) || 30;

    const pollId = `POLL-2026-${String(polls.length + 1).padStart(3, '0')}`;

    const newPoll = {
        pollId: pollId,
        irNumber: connectedIr || null,
        title: title,
        description: description,
        option1: opt1,
        option1Desc: opt1Desc,
        option2: opt2,
        option2Desc: opt2Desc,
        option3: opt3,
        option3Desc: opt3Desc,
        openDate: openDate,
        closeDate: closeDate,
        eligibleVoters: eligibleVoters,
        status: "OPEN"
    };

    await savePollRecord(newPoll);

    // If connected to an IR, automatically update its status to VOTING
    if (connectedIr) {
        const ir = issues.find(item => item.irNumber === connectedIr);
        if (ir) {
            ir.status = "VOTING";
            ir.history.push({
                status: "VOTING",
                timestamp: new Date().toISOString(),
                note: `Coordinator poll created and launched: ${pollId}`
            });
            await saveIssueRecord(ir);
        }
    }

    alert(`Poll ${pollId} created successfully and marked as active.`);
    document.getElementById('admin-create-poll-form').reset();
    loadAdminPage();
}

function loadAdminPollsList() {
    const list = document.getElementById('admin-polls-list-rows');
    list.innerHTML = '';

    if (polls.length === 0) {
        list.innerHTML = '<p class="text-muted text-center p-4">No active or archived polls exist in the database.</p>';
        return;
    }

    polls.forEach(p => {
        const pVotes = votes.filter(v => v.pollId === p.pollId);
        const div = document.createElement('div');
        div.className = 'admin-poll-row';

        const connectedBadge = p.irNumber ? `<span class="badge badge-accent mr-2" style="font-size:9px;">Linked: ${p.irNumber}</span>` : '';

        div.innerHTML = `
            <div class="admin-poll-row-header">
                <div>
                    <h4 class="admin-poll-title">${p.title}</h4>
                    <div class="admin-poll-meta mt-1">
                        ${connectedBadge}
                        <span>ID: <strong class="font-mono">${p.pollId}</strong></span> | 
                        <span>Eligible: <strong>${p.eligibleVoters || 30}</strong></span> | 
                        <span>Votes: <strong>${pVotes.length}</strong></span>
                    </div>
                </div>
                <span class="badge ${p.status === 'OPEN' ? 'badge-status-voting' : 'badge-status-archived'}">${p.status}</span>
            </div>
            
            <div class="admin-poll-actions">
                ${p.status === 'OPEN' ? 
                    `<button class="btn btn-xs btn-danger" onclick="togglePollStatus('${p.pollId}', 'CLOSED')">Close Poll</button>` : 
                    `<button class="btn btn-xs btn-outline" onclick="togglePollStatus('${p.pollId}', 'OPEN')">Open Poll</button>`
                }
                <button class="btn btn-xs btn-outline" onclick="resetPollVotes('${p.pollId}')">Reset Votes</button>
            </div>
        `;
        list.appendChild(div);
    });
}

async function togglePollStatus(pollId, newStatus) {
    const poll = polls.find(p => p.pollId === pollId);
    if (poll) {
        poll.status = newStatus;
        await savePollRecord(poll);
        loadAdminPage();
    }
}

async function resetPollVotes(pollId) {
    if (confirm(`Are you absolutely sure you want to wipe all registered voter ballots for poll ${pollId}? This cannot be undone.`)) {
        await resetPollVotesRecord(pollId);
        alert(`Ballots reset for ${pollId}.`);
        loadAdminPage();
    }
}

// Admin Tab 3: Confidential Voter Registration log
function loadAdminVotersRegistry() {
    const search = document.getElementById('admin-voters-search').value.toLowerCase();
    const tbody = document.getElementById('admin-confidential-voters-rows');
    tbody.innerHTML = '';

    // Check for duplicate voting attempts (by tracking count of CM IDs per pollId)
    const voteMap = {};
    votes.forEach(v => {
        const key = `${v.pollId}|${v.id}`;
        voteMap[key] = (voteMap[key] || 0) + 1;
    });

    const filtered = votes.filter(v => {
        const poll = polls.find(p => p.pollId === v.pollId);
        const pollTitle = poll ? poll.title.toLowerCase() : '';
        return v.name.toLowerCase().includes(search) ||
               v.id.toLowerCase().includes(search) ||
               v.option.toLowerCase().includes(search) ||
               v.pollId.toLowerCase().includes(search) ||
               pollTitle.includes(search);
    });

    filtered.forEach(v => {
        const poll = polls.find(p => p.pollId === v.pollId);
        const pollLabel = poll ? `${poll.title} (${v.pollId})` : v.pollId;
        const dt = new Date(v.timestamp);
        const dateStr = dt.toLocaleDateString();
        const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isDup = voteMap[`${v.pollId}|${v.id}`] > 1;
        const rowClass = isDup ? 'style="background-color:rgba(225, 29, 72, 0.1); border-left:4px solid var(--danger-color);"' : '';

        const tr = document.createElement('tr');
        if (rowClass) tr.setAttribute('style', 'background-color:rgba(225, 29, 72, 0.08); border-left:4px solid var(--danger-color);');

        tr.innerHTML = `
            <td><strong>${v.name}</strong></td>
            <td><span class="font-mono">${v.id}</span> ${isDup ? '<span class="badge badge-priority-urgent" style="padding:1px 4px; font-size:8px;">DUPLICATE VOTE</span>' : ''}</td>
            <td><div style="font-size:12.5px; font-weight:500;">${pollLabel}</div></td>
            <td><span class="badge badge-accent">${v.option}</span> ${v.comment ? `<div style="font-size:11px; font-style:italic;" class="text-muted">"${v.comment}"</div>` : ''}</td>
            <td style="font-family:var(--font-mono); font-size:12px;">${dateStr}</td>
            <td style="font-family:var(--font-mono); font-size:12px;">${timeStr}</td>
            <td>
                <button class="btn btn-xs btn-danger" onclick="deleteIndividualVote('${v.pollId}', '${v.id}', '${v.timestamp}')">Reset</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No voter records found in database.</td></tr>';
    }
}

async function deleteIndividualVote(pollId, cmId, timestamp) {
    if (confirm(`Do you want to reset the vote submission for Crewmember ID ${cmId} on poll ${pollId}? This will allow the crewmember to re-vote.`)) {
        await deleteVoteRecord(pollId, cmId, timestamp);
        loadAdminPage();
    }
}

// Export voter log to CSV
function exportVoterLogToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Voter Name,Employee ID,Poll ID,Ballot Option,Comment,Timestamp\n";

    votes.forEach(v => {
        const row = [
            `"${v.name.replace(/"/g, '""')}"`,
            `"${v.id.replace(/"/g, '""')}"`,
            `"${v.pollId}"`,
            `"${v.option}"`,
            `"${(v.comment || '').replace(/"/g, '""')}"`,
            `"${v.timestamp}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JFK_OPS_VOTER_LOG_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Modals Controller ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Detail Issue Modal
function openViewIssueModal(irNumber) {
    const ir = issues.find(item => item.irNumber === irNumber);
    if (!ir) return;

    document.getElementById('modal-view-ir-number').textContent = ir.irNumber;

    const dateStr = new Date(ir.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let notesHtml = '';
    // Only show internal notes to administrators
    const role = document.getElementById('role-select').value;
    if (role === 'admin') {
        notesHtml = `
            <div class="details-group">
                <div class="details-label">Internal AVC Notes (AVC View Only)</div>
                <div class="details-value" style="background:#f1f5f9; padding:8px; border-left:3px solid var(--primary-color);">${ir.notes || 'No internal committee notes recorded.'}</div>
            </div>
        `;
    }

    let leadershipHtml = '';
    if (ir.leadershipResponse) {
        leadershipHtml = `
            <div class="details-group">
                <div class="details-label">Leadership Formal Response</div>
                <div class="details-value" style="font-weight:600; color:#1e293b;">"${ir.leadershipResponse}"</div>
            </div>
        `;
    }

    let decisionHtml = '';
    if (ir.decisionSummary) {
        decisionHtml = `
            <div class="details-group">
                <div class="details-label">Final Decision Outcome</div>
                <div class="details-value" style="font-weight:700; color:var(--success-color);">${ir.decisionSummary}</div>
            </div>
        `;
    }

    // Process history events timeline
    let timelineEventsHtml = '';
    if (ir.history && ir.history.length > 0) {
        ir.history.forEach(evt => {
            const timeStr = new Date(evt.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            timelineEventsHtml += `
                <li class="timeline-event completed">
                    <div class="timeline-event-header">
                        <span class="timeline-event-name">${evt.status}</span>
                        <span class="timeline-event-time">${timeStr}</span>
                    </div>
                    <div class="timeline-event-notes">${evt.note || ''}</div>
                </li>
            `;
        });
    }

    // Process submitter info respecting anonymous status
    let submitterHtml = '';
    if (role === 'admin') {
        submitterHtml = `
            <div class="details-row-split" style="background:var(--bg-primary); padding:10px 14px; border-radius:var(--border-radius); border:1px solid var(--border-color); margin-bottom:12px;">
                <div class="details-group" style="margin-bottom:0;">
                    <div class="details-label">Submitter (Admin View)</div>
                    <div class="details-value" style="font-weight:600;">
                        ${escapeHtml(ir.name || 'Not provided')}
                        ${ir.isAnonymous ? '<span class="badge badge-accent" style="font-size:10.5px; margin-left:6px;">🔒 ANONYMOUS (Hidden from Crew)</span>' : ''}
                    </div>
                </div>
                <div class="details-group" style="margin-bottom:0;">
                    <div class="details-label">Employee ID & Shift</div>
                    <div class="details-value font-mono">
                        ${escapeHtml(ir.id || '—')} ${ir.shift ? `(${escapeHtml(ir.shift)} Shift)` : ''}
                    </div>
                </div>
            </div>
        `;
    } else {
        if (ir.isAnonymous) {
            submitterHtml = `
                <div class="details-row-split" style="background:var(--bg-primary); padding:10px 14px; border-radius:var(--border-radius); border:1px solid var(--border-color); margin-bottom:12px;">
                    <div class="details-group" style="margin-bottom:0;">
                        <div class="details-label">Submitter</div>
                        <div class="details-value text-muted" style="font-style:italic;">
                            🔒 Anonymous Crewmember
                        </div>
                    </div>
                    <div class="details-group" style="margin-bottom:0;">
                        <div class="details-label">Shift</div>
                        <div class="details-value">
                            ${ir.shift ? `${escapeHtml(ir.shift)} Shift` : 'Not specified'}
                        </div>
                    </div>
                </div>
            `;
        } else {
            submitterHtml = `
                <div class="details-row-split" style="background:var(--bg-primary); padding:10px 14px; border-radius:var(--border-radius); border:1px solid var(--border-color); margin-bottom:12px;">
                    <div class="details-group" style="margin-bottom:0;">
                        <div class="details-label">Submitter</div>
                        <div class="details-value" style="font-weight:600;">${escapeHtml(ir.name || 'Crewmember')}</div>
                    </div>
                    <div class="details-group" style="margin-bottom:0;">
                        <div class="details-label">Shift</div>
                        <div class="details-value font-mono">${ir.shift ? `${escapeHtml(ir.shift)} Shift` : '—'}</div>
                    </div>
                </div>
            `;
        }
    }

    const html = `
        <div class="details-grid">
            ${submitterHtml}
            <div class="details-row-split">
                <div class="details-group">
                    <div class="details-label">Category</div>
                    <div class="details-value" style="font-weight:600;">${ir.category}</div>
                </div>
                <div class="details-group">
                    <div class="details-label">Operational Status</div>
                    <div class="details-value">
                        <span class="badge badge-status-${ir.status.toLowerCase().replace(/ /g, '-')}">${ir.status}</span>
                    </div>
                </div>
            </div>

            <div class="details-row-split">
                <div class="details-group">
                    <div class="details-label">Priority</div>
                    <div class="details-value">
                        <span class="badge badge-priority-${ir.priority.toLowerCase()}">${ir.priority}</span>
                    </div>
                </div>
                <div class="details-group">
                    <div class="details-label">Submission Date</div>
                    <div class="details-value font-mono">${dateStr}</div>
                </div>
            </div>

            <div class="details-group">
                <div class="details-label">Issue Title</div>
                <div class="details-value" style="font-size:16px; font-weight:700; color:var(--primary-color);">${ir.title}</div>
            </div>

            <div class="details-group">
                <div class="details-label">What is currently happening?</div>
                <div class="details-value">${ir.description}</div>
            </div>

            <div class="details-group">
                <div class="details-label">How does this affect operations?</div>
                <div class="details-value">${ir.impact}</div>
            </div>

            ${ir.examples ? `
            <div class="details-group">
                <div class="details-label">Supporting Information & Examples</div>
                <div class="details-value">${ir.examples}</div>
            </div>` : ''}

            <div class="details-group">
                <div class="details-label">Proposed Solution (Crew Recommendation)</div>
                <div class="details-value" style="font-weight:500; font-style:italic;">${ir.proposedSolution}</div>
            </div>

            <div class="details-row-split">
                <div class="details-group">
                    <div class="details-label">Assigned Owner (POC)</div>
                    <div class="details-value">${ir.owner || 'Unassigned'}</div>
                </div>
                <div class="details-group">
                    <div class="details-label">Target Follow-Up Date</div>
                    <div class="details-value font-mono">${ir.followUpDate ? new Date(ir.followUpDate).toLocaleDateString() : 'Pending Scheduling'}</div>
                </div>
            </div>

            <div class="details-group">
                <div class="details-label">Tactical Next Action</div>
                <div class="details-value" style="font-family:var(--font-mono); font-size:13px; color:var(--warning-color); font-weight:600;">${ir.nextAction || 'Awaiting initial evaluation'}</div>
            </div>

            ${leadershipHtml}
            ${decisionHtml}
            ${notesHtml}

            <!-- History Timeline -->
            <div class="timeline-container">
                <h4 style="font-size:13px; text-transform:uppercase; color:var(--primary-color); margin-bottom:12px;">Request Status History</h4>
                <ul class="timeline-list">
                    ${timelineEventsHtml}
                </ul>
            </div>
        </div>
    `;

    document.getElementById('modal-view-content').innerHTML = html;

    // Toggle Manage Button based on Admin Role
    const manageBtn = document.getElementById('modal-view-btn-manage');
    if (role === 'admin') {
        manageBtn.classList.remove('hidden');
        manageBtn.onclick = () => {
            closeModal('modal-view-issue');
            openManageIssueModal(ir.irNumber);
        };
    } else {
        manageBtn.classList.add('hidden');
    }

    openModal('modal-view-issue');
}

// Admin Edit & Manage Request Modal
function openManageIssueModal(irNumber) {
    const ir = issues.find(item => item.irNumber === irNumber);
    if (!ir) return;

    document.getElementById('modal-manage-ir-number').textContent = `Edit & Manage Request ${ir.irNumber}`;
    document.getElementById('manage-issue-idx').value = ir.irNumber;

    // 1. Populate Core Issue Details
    document.getElementById('manage-title').value = ir.title || '';
    document.getElementById('manage-category').value = ir.category || 'Policy / Procedure';
    document.getElementById('manage-priority').value = ir.priority || 'Medium';
    document.getElementById('manage-submitter-name').value = ir.name || '';
    document.getElementById('manage-submitter-id').value = ir.id || '';
    document.getElementById('manage-submitter-shift').value = ir.shift || 'AM';
    const anonCheckbox = document.getElementById('manage-is-anonymous');
    if (anonCheckbox) anonCheckbox.checked = !!ir.isAnonymous;
    document.getElementById('manage-description').value = ir.description || '';
    document.getElementById('manage-impact').value = ir.impact || '';
    document.getElementById('manage-examples').value = ir.examples || '';
    document.getElementById('manage-solution').value = ir.proposedSolution || ir.solution || '';

    // 2. Populate Status & Administrative Tracking Fields
    document.getElementById('manage-status').value = ir.status || 'SUBMITTED';
    document.getElementById('manage-owner').value = ir.owner || '';
    document.getElementById('manage-followup-date').value = ir.followUpDate || '';
    document.getElementById('manage-next-action').value = ir.nextAction || '';
    document.getElementById('manage-leadership-response').value = ir.leadershipResponse || '';
    document.getElementById('manage-internal-notes').value = ir.notes || '';
    document.getElementById('manage-decision').value = ir.decisionSummary || '';

    // 3. Configure Delete button inside modal
    const deleteBtn = document.getElementById('btn-delete-current-ir');
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            const confirmed = confirm(
                `Are you sure you want to permanently delete Issue Request ${ir.irNumber} ("${ir.title}")?\n\nThis will remove the request from both cloud and local records. This action cannot be undone.`
            );
            if (confirmed) {
                closeModal('modal-manage-issue');
                await deleteIssueRecord(ir.irNumber);
                alert(`Issue Request ${ir.irNumber} has been permanently deleted.`);
                loadAdminPage();
                refreshActivePage();
            }
        };
    }

    openModal('modal-manage-issue');
}

async function handleManageIssueSave(event) {
    event.preventDefault();

    const irNumber = document.getElementById('manage-issue-idx').value;
    const ir = issues.find(item => item.irNumber === irNumber);
    if (!ir) return;

    const oldStatus = ir.status;
    const newStatus = document.getElementById('manage-status').value;
    const newPriority = document.getElementById('manage-priority').value;

    // Update Core Fields
    ir.title = document.getElementById('manage-title').value.trim();
    ir.category = document.getElementById('manage-category').value;
    ir.priority = newPriority;
    ir.name = document.getElementById('manage-submitter-name').value.trim();
    ir.id = document.getElementById('manage-submitter-id').value.trim();
    ir.shift = document.getElementById('manage-submitter-shift').value;
    const anonCheckbox = document.getElementById('manage-is-anonymous');
    ir.isAnonymous = anonCheckbox ? anonCheckbox.checked : false;
    ir.description = document.getElementById('manage-description').value.trim();
    ir.impact = document.getElementById('manage-impact').value.trim();
    ir.examples = document.getElementById('manage-examples').value.trim();
    const solVal = document.getElementById('manage-solution').value.trim();
    ir.proposedSolution = solVal;
    ir.solution = solVal;

    // Update Status & Tracking Fields
    ir.status = newStatus;
    ir.owner = document.getElementById('manage-owner').value.trim();
    ir.followUpDate = document.getElementById('manage-followup-date').value;
    ir.nextAction = document.getElementById('manage-next-action').value.trim();
    ir.leadershipResponse = document.getElementById('manage-leadership-response').value.trim();
    ir.notes = document.getElementById('manage-internal-notes').value.trim();
    ir.decisionSummary = document.getElementById('manage-decision').value.trim();

    if (!ir.history) {
        ir.history = [];
    }

    // Add event log if status changes
    if (oldStatus !== newStatus) {
        ir.history.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: `Status updated from ${oldStatus} to ${newStatus} by Admin`
        });
    } else {
        ir.history.push({
            status: ir.status,
            timestamp: new Date().toISOString(),
            note: `Issue details & progress updated by Admin`
        });
    }

    await saveIssueRecord(ir);
    closeModal('modal-manage-issue');
    alert(`Request ${irNumber} updated successfully.`);
    loadAdminPage();
    refreshActivePage();
}

// Crewmember ballot modal
function openBallotModal(pollId) {
    const poll = polls.find(p => p.pollId === pollId);
    if (!poll) return;

    document.getElementById('ballot-poll-id').value = poll.pollId;
    document.getElementById('ballot-poll-title').textContent = poll.title;
    document.getElementById('ballot-poll-desc').textContent = poll.description;

    // Set Option text labels
    document.getElementById('ballot-opt1-title').textContent = poll.option1;
    document.getElementById('ballot-opt1-desc').textContent = poll.option1Desc || '';
    
    document.getElementById('ballot-opt2-title').textContent = poll.option2;
    document.getElementById('ballot-opt2-desc').textContent = poll.option2Desc || '';

    document.getElementById('ballot-opt3-title').textContent = poll.option3;
    document.getElementById('ballot-opt3-desc').textContent = poll.option3Desc || '';

    // Reset error messages and form
    document.getElementById('vote-error-message').classList.add('hidden');
    document.getElementById('crewmember-vote-form').reset();
    
    // Quick populate from quick-login simulator if active
    syncDemoLoginFields();

    openModal('modal-submit-vote');
}

async function handleVoteSubmit(event) {
    event.preventDefault();

    const pollId = document.getElementById('ballot-poll-id').value;
    const name = document.getElementById('vote-cm-name').value.trim();
    const cmId = document.getElementById('vote-cm-id').value.trim();
    const optVal = document.querySelector('input[name="ballot-option"]:checked').value;
    const comment = document.getElementById('vote-comment').value.trim();

    // Check for duplicate vote per Crewmember ID on this specific poll
    const isDuplicate = votes.some(v => v.pollId === pollId && v.id.toLowerCase() === cmId.toLowerCase());
    if (isDuplicate) {
        document.getElementById('vote-error-message').classList.remove('hidden');
        return;
    }

    // Save vote
    const newVote = {
        pollId: pollId,
        name: name,
        id: cmId,
        option: optVal,
        comment: comment,
        timestamp: new Date().toISOString()
    };

    await saveVoteRecord(newVote);

    closeModal('modal-submit-vote');
    alert("Thank you. Your vote has been recorded.");
    
    // Re-render
    loadVotePage();
    loadDashboard();
}

// --- Role Switcher Restrictions ---
function handleRoleChange() {
    const role = document.getElementById('role-select').value;
    const adminNav = document.querySelector('.admin-only-nav');

    if (role === 'admin') {
        adminNav.classList.remove('hidden');
    } else {
        adminNav.classList.add('hidden');
        // If current active tab is admin, jump back to dashboard
        const currentActive = document.querySelector('.nav-item.active').getAttribute('data-target');
        if (currentActive === 'admin') {
            switchTab('dashboard');
        }
    }
}

// --- Visual Theme Changer ---
let activeTheme = 'version-a';
function handleThemeChange() {
    const val = document.getElementById('theme-select').value;
    if (val === 'mobile-sim') {
        document.body.classList.add('mobile-view');
        document.documentElement.setAttribute('data-theme', activeTheme);
    } else {
        document.body.classList.remove('mobile-view');
        activeTheme = val;
        document.documentElement.setAttribute('data-theme', val);
    }
}

// --- Quick Login Sync Helper ---
function syncDemoLoginFields() {
    // Simulator removed per user request
}


// --- Admin Cloud Settings & Status Shortcut ---
function openCloudSettingsShortcut() {
    const roleSelect = document.getElementById('role-select');
    if (roleSelect && roleSelect.value === 'admin') {
        switchTab('admin');
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        const tabBtn = document.querySelector('[data-admin-tab="admin-settings"]');
        const tabContent = document.getElementById('admin-tab-admin-settings');
        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    } else {
        openAdminAuthModal();
    }
}

function initCloudSettingsUI() {
    const form = document.getElementById('firebase-config-form');
    if (!form) return;

    // Prepopulate inputs if configuration exists
    const config = (typeof getActiveFirebaseConfig === 'function') ? getActiveFirebaseConfig() : null;
    if (config) {
        if (config.projectId) document.getElementById('fb-project-id').value = config.projectId;
        if (config.apiKey) document.getElementById('fb-api-key').value = config.apiKey;
        if (config.authDomain) document.getElementById('fb-auth-domain').value = config.authDomain || '';
        if (config.appId) document.getElementById('fb-app-id').value = config.appId || '';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const jsonPaste = document.getElementById('fb-json-paste').value.trim();
        let newConfig = {};

        if (jsonPaste) {
            try {
                newConfig = JSON.parse(jsonPaste);
            } catch (err) {
                alert("Invalid JSON format in the paste box. Please verify the syntax or use the individual fields.");
                return;
            }
        } else {
            const projId = document.getElementById('fb-project-id').value.trim();
            const apiKey = document.getElementById('fb-api-key').value.trim();
            const authDom = document.getElementById('fb-auth-domain').value.trim() || `${projId}.firebaseapp.com`;
            const appId = document.getElementById('fb-app-id').value.trim();

            newConfig = {
                projectId: projId,
                apiKey: apiKey,
                authDomain: authDom,
                appId: appId,
                storageBucket: `${projId}.appspot.com`
            };
        }

        if (!newConfig.projectId || !newConfig.apiKey) {
            alert("Firebase Project ID and API Key are required to enable cloud synchronization.");
            return;
        }

        localStorage.setItem('jfk_ops_firebase_config', JSON.stringify(newConfig));
        alert("Firebase Cloud Database configured! Connecting to live Firestore...");
        initDataSync();
    });

    const testBtn = document.getElementById('btn-test-cloud-connection');
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const feedback = document.getElementById('cloud-config-feedback');
            feedback.classList.remove('hidden', 'alert-danger', 'alert-success', 'alert-info');
            feedback.className = 'mt-3 alert alert-info';
            feedback.textContent = 'Testing connection to Google Cloud Firestore...';

            if (!isCloudConnected || !db) {
                feedback.className = 'mt-3 alert alert-danger';
                feedback.textContent = 'Error: Cloud database is not connected. Enter your Firebase Project ID and API Key above, then click "Save & Connect".';
                return;
            }

            try {
                await db.collection('_health').doc('ping').set({
                    ping: Date.now(),
                    system: 'JFK OPS AVC System',
                    verifiedBy: 'AVC Admin'
                });
                feedback.className = 'mt-3 alert alert-success';
                feedback.textContent = '✅ Connection Verified! Firestore read/write permissions are active. All 30 crew members will share real-time updates on your link.';
            } catch (err) {
                feedback.className = 'mt-3 alert alert-danger';
                feedback.textContent = `Connection failed: ${err.message}. Please verify your Project ID, API Key, and Firestore security rules.`;
            }
        });
    }

    const disconnectBtn = document.getElementById('btn-disconnect-cloud');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            if (confirm("Switch back to Local Storage mode? Data will only be saved in this browser.")) {
                localStorage.removeItem('jfk_ops_firebase_config');
                alert("Cloud database disconnected. The system will operate in local mode.");
                location.reload();
            }
        });
    }
}

// --- Bind all Event Listeners ---
function bindEvents() {
    // 1. Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            switchTab(target);
        });
    });

    // 2. Form submission handlers
    document.getElementById('issue-request-form').addEventListener('submit', handleIssueSubmit);
    document.getElementById('admin-manage-issue-form').addEventListener('submit', handleManageIssueSave);
    document.getElementById('admin-create-poll-form').addEventListener('submit', handleCreatePoll);
    document.getElementById('crewmember-vote-form').addEventListener('submit', handleVoteSubmit);

    // 3. Filters & Search listeners
    document.getElementById('issues-search').addEventListener('input', loadOpenIssues);
    document.getElementById('filter-category').addEventListener('change', loadOpenIssues);
    document.getElementById('filter-status').addEventListener('change', loadOpenIssues);
    document.getElementById('filter-priority').addEventListener('change', loadOpenIssues);
    
    document.getElementById('btn-clear-search').addEventListener('click', () => {
        document.getElementById('issues-search').value = '';
        loadOpenIssues();
    });
    
    document.getElementById('btn-reset-issues-filters').addEventListener('click', () => {
        document.getElementById('issues-search').value = '';
        document.getElementById('filter-category').value = 'all';
        document.getElementById('filter-status').value = 'all';
        document.getElementById('filter-priority').value = 'all';
        loadOpenIssues();
    });

    // Admin filters
    document.getElementById('admin-issues-search').addEventListener('input', loadAdminIssuesTable);
    document.getElementById('admin-filter-category').addEventListener('change', loadAdminIssuesTable);
    document.getElementById('admin-filter-status').addEventListener('change', loadAdminIssuesTable);

    // Meeting Notes filters and actions
    const notesSearch = document.getElementById('admin-notes-search');
    if (notesSearch) notesSearch.addEventListener('input', loadMeetingNotes);
    const notesFilterIr = document.getElementById('admin-filter-notes-ir');
    if (notesFilterIr) notesFilterIr.addEventListener('change', loadMeetingNotes);
    const btnCreateNote = document.getElementById('btn-open-create-note');
    if (btnCreateNote) btnCreateNote.addEventListener('click', () => openMeetingNoteModal());
    const meetingNoteForm = document.getElementById('admin-meeting-note-form');
    if (meetingNoteForm) meetingNoteForm.addEventListener('submit', handleMeetingNoteSave);

    // Email Builder actions
    document.querySelectorAll('.email-tpl-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = btn.getAttribute('data-tpl');
            if (tpl) switchEmailTemplate(tpl);
        });
    });
    const btnApplyIrEmail = document.getElementById('btn-apply-ir-to-email');
    if (btnApplyIrEmail) btnApplyIrEmail.addEventListener('click', applySelectedIrToEmail);
    const btnCopyEmailText = document.getElementById('btn-copy-email-text');
    if (btnCopyEmailText) btnCopyEmailText.addEventListener('click', copyEmailText);
    const btnCopyEmailHtml = document.getElementById('btn-copy-email-html');
    if (btnCopyEmailHtml) btnCopyEmailHtml.addEventListener('click', copyEmailHtml);

    document.getElementById('admin-voters-search').addEventListener('input', loadAdminVotersRegistry);
    document.getElementById('btn-export-voters').addEventListener('click', exportVoterLogToCSV);

    // Quarterly selectors
    document.getElementById('report-year-select').addEventListener('change', loadUpdatesPage);
    document.getElementById('report-quarter-select').addEventListener('change', loadUpdatesPage);

    // 4. Header Role and UI Theme controllers
    document.getElementById('role-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'admin') {
            // Keep dropdown value at crewmember until password verified
            e.target.value = 'crewmember';
            openAdminAuthModal();
        } else {
            handleRoleChange();
            // re-render current page
            const currentActive = document.querySelector('.nav-item.active').getAttribute('data-target');
            switchTab(currentActive);
        }
    });
    document.getElementById('theme-select').addEventListener('change', handleThemeChange);

    // Admin password authentication elements
    document.getElementById('admin-auth-form').addEventListener('submit', handleAdminAuthSubmit);
    document.getElementById('btn-close-admin-auth').addEventListener('click', closeAdminAuthModal);

    // 5. Utility simulator triggers
    document.getElementById('btn-reset-demo-data').addEventListener('click', resetDemoData);



    // 6. Cloud Database Settings
    initCloudSettingsUI();

    // 7. Admin subtab toggles
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-admin-tab');
            switchAdminSubTab(targetTab);
        });
    });

    // 8. Ops SOP & Checklist controls
    const resetSopBtn = document.getElementById('btn-sop-reset-checklist');
    if (resetSopBtn) {
        resetSopBtn.addEventListener('click', handleResetSOPChecklist);
    }
    const markAllSopBtn = document.getElementById('btn-sop-mark-all');
    if (markAllSopBtn) {
        markAllSopBtn.addEventListener('click', handleMarkAllSOPChecklist);
    }
}

// Global Admin Subtab Switcher
function switchAdminSubTab(targetTab) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector(`[data-admin-tab="${targetTab}"]`);
    if (btn) btn.classList.add('active');
    const content = document.getElementById(`admin-tab-${targetTab}`);
    if (content) content.classList.add('active');

    // Trigger tab-specific loaders
    if (targetTab === 'admin-sop') {
        loadSOPChecklist();
    } else if (targetTab === 'admin-email') {
        loadEmailBuilder();
    } else if (targetTab === 'admin-notes') {
        loadMeetingNotes();
    } else if (targetTab === 'admin-issues') {
        loadAdminIssuesTable();
    }
}

// --- Set current Year and Quarter on Load ---
function initCurrentQuarterSelector() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Determine quarter
    let currentQuarter = 'Q1';
    if (currentMonth >= 3 && currentMonth <= 5) {
        currentQuarter = 'Q2';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
        currentQuarter = 'Q3';
    } else if (currentMonth >= 9 && currentMonth <= 11) {
        currentQuarter = 'Q4';
    }
    
    // Dynamically populate Year selector (guaranteed up to 2055, and rolls forward indefinitely)
    const yearSelect = document.getElementById('report-year-select');
    if (yearSelect) {
        populateYearDropdown(yearSelect, currentYear);
    }
    
    // Set Quarter selector
    const quarterSelect = document.getElementById('report-quarter-select');
    if (quarterSelect) {
        quarterSelect.value = currentQuarter;
    }
}

// Dynamically generate and maintain year list up to 2055 and beyond
function populateYearDropdown(yearSelect, currentYear) {
    if (!yearSelect) return;

    const minYear = 2024;
    // Guaranteed up to at least 2055, and automatically extends if the year exceeds 2055
    const maxYear = Math.max(2055, currentYear + 2);

    const currentlySelected = yearSelect.value || String(currentYear);

    yearSelect.innerHTML = '';
    // Populate in descending order: newest years on top
    for (let yr = maxYear; yr >= minYear; yr--) {
        const opt = document.createElement('option');
        opt.value = String(yr);
        opt.textContent = String(yr);
        yearSelect.appendChild(opt);
    }

    // Default to currentYear, or preserve user's valid selection
    if (currentlySelected && parseInt(currentlySelected) >= minYear && parseInt(currentlySelected) <= maxYear) {
        yearSelect.value = currentlySelected;
    } else {
        yearSelect.value = String(currentYear);
    }
}

// Bridge from Quarterly Transparency Updates to Email Builder
function draftQuarterlyEmailUpdate() {
    const yearVal = document.getElementById('report-year-select').value;
    const quarterVal = document.getElementById('report-quarter-select').value;
    
    // Switch role to admin if currently non-admin
    const roleSelect = document.getElementById('role-select');
    if (roleSelect && roleSelect.value !== 'admin') {
        roleSelect.value = 'admin';
        handleRoleChange();
    }
    
    switchTab('admin');
    switchAdminSubTab('admin-email');
    switchEmailTemplate('monthly-update');
    
    setTimeout(() => {
        const periodInput = document.getElementById('email-mu-period');
        if (periodInput) {
            periodInput.value = `${quarterVal} ${yearVal} Transparency Update`;
            updateEmailPreview();
        }
    }, 120);
}

// --- App Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    initDataSync();
    bindEvents();
    initCurrentQuarterSelector();
    
    // Initial UI state setup
    handleRoleChange();
    handleThemeChange();
    
    // Load default landing tab
    switchTab('dashboard');
});
