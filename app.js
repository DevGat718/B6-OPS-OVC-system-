/* ==========================================================================
   JFK OPS - AVC Issue Request & Voting System
   Application Logic - Data Management, State Synchronization, & Event Listeners
   ========================================================================== */

// --- Global App State Data ---
let issues = [];
let polls = [];
let votes = [];

// --- Default Mock Data Generators ---
const DEFAULT_ISSUES = [
    {
        irNumber: "IR-2026-001",
        name: "John Doe",
        id: "CM84021",
        shift: "AM",
        date: "2026-01-15T08:30:00-05:00",
        category: "Scheduling",
        title: "Fatigue-Mitigating Scheduling Rotation",
        description: "The current scheduling pattern requires AM shift coordinators to transition to PM shifts with less than 12 hours of rest between shifts on consecutive days. This has been happening weekly and is impacting energy levels.",
        impact: "Severe fatigue during PM shifts, increasing the risk of operational errors, gate assignment latency, and crew coordination delays.",
        examples: "AM shift ending at 14:00 followed by a PM shift starting at 02:00 the following morning.",
        proposedSolution: "Establish a minimum 14-hour rest transition window for any coordinator rotating from AM to PM shifts, or restrict rotations to set monthly blocks.",
        priority: "High",
        voteRequested: "Yes",
        status: "COMPLETED",
        owner: "Dave Jones, AVC Rep",
        notes: "Discussed at AVC committee meeting. Proposed to Scheduling director. Agreement reached to adjust AM-to-PM rotation patterns.",
        leadershipResponse: "Leadership has agreed to revise scheduling guidelines. Starting Q2 2026, rotation rest windows will increase to a minimum of 14 hours.",
        nextAction: "None - Change successfully implemented",
        followUpDate: "",
        decisionSummary: "Rest requirement integrated into monthly roster build logic.",
        history: [
            { status: "SUBMITTED", timestamp: "2026-01-15T08:30:00-05:00", note: "Issue request submitted by John Doe." },
            { status: "UNDER REVIEW", timestamp: "2026-01-18T10:00:00-05:00", note: "AVC assigned Dave Jones as owner." },
            { status: "SUBMITTED TO LEADERSHIP", timestamp: "2026-01-25T14:00:00-05:00", note: "Formal proposal sent to Operations Director." },
            { status: "APPROVED", timestamp: "2026-02-05T09:00:00-05:00", note: "Leadership approved the proposal." },
            { status: "IMPLEMENTING", timestamp: "2026-02-15T08:00:00-05:00", note: "Testing rosters with new rotation parameters." },
            { status: "COMPLETED", timestamp: "2026-03-01T17:00:00-05:00", note: "Rosters successfully published under new rules." }
        ]
    },
    {
        irNumber: "IR-2026-002",
        name: "Alice Smith",
        id: "CM38294",
        shift: "PM",
        date: "2026-04-12T15:45:00-04:00",
        category: "Facilities",
        title: "Air Conditioning Malfunction in Breakroom",
        description: "The primary air conditioning unit in the JFK T5 Operations breakroom is failing. Temperature readings inside have repeatedly exceeded 78 degrees during summer afternoons, making rest breaks uncomfortable.",
        impact: "Coordinators have no climate-controlled space to take mandatory rest breaks, leading to fatigue and discomfort during shifts.",
        examples: "High temperature alerts documented on July 10, 11, and 12.",
        proposedSolution: "Replace or overhaul the compressor for the T5 Ops breakroom line immediately.",
        priority: "Urgent",
        voteRequested: "No",
        status: "IMPLEMENTING",
        owner: "Elena Rostova, AVC Sec",
        notes: "Facilities department contacted. Work order #F-98201 was generated. Compressor parts are on backorder.",
        leadershipResponse: "Facilities management acknowledges issue. Temporary spot cooling units have been installed in the breakroom.",
        nextAction: "Track compressor installation date with contractor",
        followUpDate: "2026-08-10",
        decisionSummary: "",
        history: [
            { status: "SUBMITTED", timestamp: "2026-04-12T15:45:00-04:00", note: "Issue request submitted by Alice Smith." },
            { status: "UNDER REVIEW", timestamp: "2026-04-14T09:30:00-04:00", note: "Assigned to Elena Rostova." },
            { status: "APPROVED", timestamp: "2026-04-16T11:00:00-04:00", note: "Facilities approved the replacement request." },
            { status: "IMPLEMENTING", timestamp: "2026-04-20T14:00:00-04:00", note: "Temporary spot coolers placed while parts are shipped." }
        ]
    },
    {
        irNumber: "IR-2026-003",
        name: "Elena Rostova",
        id: "CM90283",
        shift: "AM",
        date: "2026-07-28T10:15:00-04:00",
        category: "Operational Process",
        title: "Support Coordinator Role During Peak Operations",
        description: "During peak departure blocks, the main Operations Coordinator is overwhelmed by gate changes, tow coordination, and radio traffic. We need a designated support coordinator to assist with minor tasks.",
        impact: "Severe workload spikes lead to radio queue times, flight dispatch delays, and customer boarding delays.",
        examples: "Happens daily between 16:00 and 19:30 during European departures.",
        proposedSolution: "Create a dedicated peak-hours assistant slot or a dedicated full-time support coordinator roster line.",
        priority: "High",
        voteRequested: "Yes",
        status: "VOTING",
        owner: "Dave Jones, AVC Rep",
        notes: "Determined that coordinator feedback is critical. Set up a department poll to vote on options.",
        leadershipResponse: "Leadership is open to adding headcount if data shows a strong preference and business case.",
        nextAction: "Collect vote results and draft presentation",
        followUpDate: "2026-08-08",
        decisionSummary: "",
        history: [
            { status: "SUBMITTED", timestamp: "2026-07-28T10:15:00-04:00", note: "Issue request submitted by Elena Rostova." },
            { status: "UNDER REVIEW", timestamp: "2026-07-29T11:00:00-04:00", note: "AVC assigned Dave Jones." },
            { status: "VOTING", timestamp: "2026-08-01T08:00:00-04:00", note: "Department vote opened by AVC Admin." }
        ]
    },
    {
        irNumber: "IR-2026-004",
        name: "Robert Johnson",
        id: "CM47291",
        shift: "Mid",
        date: "2026-07-30T23:10:00-04:00",
        category: "Compensation",
        title: "Ad-hoc Shift Coverage Bonus Policy",
        description: "Crewmembers covering last-minute open lines within 2 hours of departure do not receive the same premium shift incentive as those booking 24 hours in advance.",
        impact: "Coordinators are hesitant to answer emergency coverage calls, leading to short-staffed operation shifts.",
        examples: "Occurred twice on the weekend of July 25th.",
        proposedSolution: "Implement a flat $50 'Ready Reserve' coverage bonus for shifts filled on less than 3 hours notice.",
        priority: "Medium",
        voteRequested: "Unsure / AVC Decide",
        status: "SUBMITTED TO LEADERSHIP",
        owner: "Dave Jones, AVC Rep",
        notes: "Formal petition drafted and submitted to HR/Finance and JFK Airport operations lead.",
        leadershipResponse: "Currently being analyzed by regional finance team. Response expected by September.",
        nextAction: "Request status update at next monthly roundtable",
        followUpDate: "2026-09-01",
        decisionSummary: "",
        history: [
            { status: "SUBMITTED", timestamp: "2026-07-30T23:10:00-04:00", note: "Issue request submitted by Robert Johnson." },
            { status: "UNDER REVIEW", timestamp: "2026-08-01T09:00:00-04:00", note: "Under review by AVC Committee." },
            { status: "SUBMITTED TO LEADERSHIP", timestamp: "2026-08-03T11:30:00-04:00", note: "Elevated to regional finance leadership." }
        ]
    },
    {
        irNumber: "IR-2026-005",
        name: "Michael Chang",
        id: "CM55281",
        shift: "PM",
        date: "2026-08-02T13:40:00-04:00",
        category: "Technology / Systems",
        title: "Coordination Flight Tracking Latency",
        description: "The primary flight dispatch tracking dashboard in the coordinator desk has a 3-5 minute delay in reflecting gate capture times compared to real-time ACARS reports.",
        impact: "Coordination is operating on delayed gate status data, causing tow trucks to be dispatched prematurely or late.",
        examples: "Affecting both terminal screens and mobile tablets.",
        proposedSolution: "Refetch database feed API endpoints every 30 seconds instead of 5 minutes.",
        priority: "Medium",
        voteRequested: "No",
        status: "UNDER REVIEW",
        owner: "Elena Rostova, AVC Sec",
        notes: "Contacting Systems Administrator to verify if local refresh intervals can be configured.",
        leadershipResponse: "",
        nextAction: "Obtain IT feedback on local registry refresh settings",
        followUpDate: "2026-08-15",
        decisionSummary: "",
        history: [
            { status: "SUBMITTED", timestamp: "2026-08-02T13:40:00-04:00", note: "Issue request submitted by Michael Chang." },
            { status: "UNDER REVIEW", timestamp: "2026-08-04T09:00:00-04:00", note: "Assigned to Elena Rostova for systems lookup." }
        ]
    },
    {
        irNumber: "IR-2026-006",
        name: "Daniel Alvarez",
        id: "CM19283",
        shift: "AM",
        date: "2026-08-03T07:20:00-04:00",
        category: "AO / GO / OPS Coordination",
        title: "Gate Ingestion Process Delay",
        description: "Airport operations coordination does not update towing arrivals fast enough, leaving airplanes holding on taxiway Tango for gate clear alerts.",
        impact: "Blocks taxiway corridors and results in engine burn fuel waste.",
        examples: "Tango hold times exceed 12 minutes on average during arrivals bank.",
        proposedSolution: "Clarify coordinator rules for releasing taxi slots.",
        priority: "Low",
        voteRequested: "Unsure / AVC Decide",
        status: "NEEDS INFORMATION",
        owner: "Unassigned",
        notes: "Requested logs from submitter to identify specific flight arrivals and gate numbers.",
        leadershipResponse: "",
        nextAction: "Wait for submitter feedback on specific gate delay times",
        followUpDate: "2026-08-12",
        decisionSummary: "",
        history: [
            { status: "SUBMITTED", timestamp: "2026-08-03T07:20:00-04:00", note: "Issue request submitted by Daniel Alvarez." },
            { status: "NEEDS INFORMATION", timestamp: "2026-08-04T10:00:00-04:00", note: "Status changed to NEEDS INFORMATION by reviewer." }
        ]
    }
];

const DEFAULT_POLLS = [
    {
        pollId: "POLL-2026-001",
        irNumber: "IR-2026-003",
        title: "Support Coordinator Role During Peak Operations",
        description: "AVC is negotiating resource allocation. In order to present a strong data-backed case to leadership, please vote on your preferred operational configuration.",
        option1: "Full-Time Support Coordinator",
        option1Desc: "Create a dedicated full-time coordinator line on all AM/PM rosters to handle background tasks.",
        option2: "Peak-Hours Support Coordinator",
        option2Desc: "Assign an extra helper only during high departure slots (16:00 to 20:00 departures).",
        option3: "Maintain Current Process",
        option3Desc: "Keep existing single coordinator rotation without adding dedicated support personnel.",
        openDate: "2026-08-01",
        closeDate: "2026-08-10",
        eligibleVoters: 68,
        status: "OPEN"
    },
    {
        pollId: "POLL-2025-004",
        irNumber: "IR-2026-001",
        title: "AM-PM Rotation Rest Periods",
        description: "Historical vote to gauge coordinator feedback on AM-to-PM shift transition rest requirements.",
        option1: "12 Hours Minimum Rest",
        option1Desc: "Coordinators require at least 12 hours between consecutive shifts.",
        option2: "14 Hours Minimum Rest",
        option2Desc: "Coordinators require at least 14 hours between consecutive shifts (Recommended).",
        option3: "Standard FAA Roster Guidelines",
        option3Desc: "Keep scheduling in alignment with FAA minimum limits (currently 9-10 hours).",
        openDate: "2026-01-20",
        closeDate: "2026-01-30",
        eligibleVoters: 68,
        status: "CLOSED"
    }
];

const DEFAULT_VOTES = [
    // Poll 2026-001 (Active, 34 mock votes pre-populated to show charts)
    { pollId: "POLL-2026-001", name: "David Miller", id: "CM10291", option: "Option 1", comment: "This is crucial, workload is unsafe during summer peaks.", timestamp: "2026-08-01T09:12:00-04:00" },
    { pollId: "POLL-2026-001", name: "Sarah Connor", id: "CM29384", option: "Option 1", comment: "We need full-time support, peak-hours only doesn't account for delays.", timestamp: "2026-08-01T10:15:00-04:00" },
    { pollId: "POLL-2026-001", name: "James Bond", id: "CM00007", option: "Option 2", comment: "Peak support is fine and more realistic for approval.", timestamp: "2026-08-01T11:40:00-04:00" },
    { pollId: "POLL-2026-001", name: "Patricia Neal", id: "CM48291", option: "Option 1", comment: "", timestamp: "2026-08-01T14:22:00-04:00" },
    { pollId: "POLL-2026-001", name: "Robert Shaw", id: "CM29103", option: "Option 3", comment: "We just need better training, not another body on desk.", timestamp: "2026-08-02T08:11:00-04:00" },
    { pollId: "POLL-2026-001", name: "Linda Blair", id: "CM39182", option: "Option 1", comment: "We are burning out. Yes to Option 1.", timestamp: "2026-08-02T10:30:00-04:00" },
    { pollId: "POLL-2026-001", name: "Gary Oldman", id: "CM73921", option: "Option 2", comment: "", timestamp: "2026-08-02T16:15:00-04:00" },
    { pollId: "POLL-2026-001", name: "Bruce Wayne", id: "CM99999", option: "Option 1", comment: "Full time is best.", timestamp: "2026-08-03T01:20:00-04:00" },
    { pollId: "POLL-2026-001", name: "Clark Kent", id: "CM77777", option: "Option 2", comment: "Peak block support solves 90% of the issues.", timestamp: "2026-08-03T08:05:00-04:00" },
    { pollId: "POLL-2026-001", name: "Diana Prince", id: "CM88888", option: "Option 1", comment: "", timestamp: "2026-08-03T09:15:00-04:00" },
    { pollId: "POLL-2026-001", name: "Hal Jordan", id: "CM33333", option: "Option 1", comment: "", timestamp: "2026-08-03T10:20:00-04:00" },
    { pollId: "POLL-2026-001", name: "Barry Allen", id: "CM11111", option: "Option 1", comment: "Workload gets unsafe quickly.", timestamp: "2026-08-03T11:45:00-04:00" },
    { pollId: "POLL-2026-001", name: "Arthur Curry", id: "CM22222", option: "Option 3", comment: "", timestamp: "2026-08-03T13:00:00-04:00" },
    { pollId: "POLL-2026-001", name: "Victor Stone", id: "CM44444", option: "Option 2", comment: "", timestamp: "2026-08-03T14:15:00-04:00" },
    { pollId: "POLL-2026-001", name: "Oliver Queen", id: "CM55555", option: "Option 2", comment: "Let's be realistic, management won't give us Option 1.", timestamp: "2026-08-03T15:30:00-04:00" },
    { pollId: "POLL-2026-001", name: "Peter Parker", id: "CM12121", option: "Option 1", comment: "With great operations comes great responsibility. Option 1.", timestamp: "2026-08-03T17:10:00-04:00" },
    { pollId: "POLL-2026-001", name: "Tony Stark", id: "CM30000", option: "Option 1", comment: "Need automation too, but full-time coordinator is step 1.", timestamp: "2026-08-04T08:00:00-04:00" },
    { pollId: "POLL-2026-001", name: "Steve Rogers", id: "CM19450", option: "Option 1", comment: "A solid plan to protect our crew.", timestamp: "2026-08-04T09:30:00-04:00" },
    { pollId: "POLL-2026-001", name: "Natasha Romanoff", id: "CM99000", option: "Option 2", comment: "", timestamp: "2026-08-04T10:15:00-04:00" },
    { pollId: "POLL-2026-001", name: "Bruce Banner", id: "CM80000", option: "Option 2", comment: "Stress is too high otherwise.", timestamp: "2026-08-04T11:00:00-04:00" },
    { pollId: "POLL-2026-001", name: "Thor Odinson", id: "CM10000", option: "Option 1", comment: "", timestamp: "2026-08-04T12:00:00-04:00" },
    { pollId: "POLL-2026-001", name: "Wanda Maximoff", id: "CM50000", option: "Option 1", comment: "", timestamp: "2026-08-04T13:40:00-04:00" },
    { pollId: "POLL-2026-001", name: "Vision Android", id: "CM01010", option: "Option 2", comment: "Efficiency metrics suggest Option 2 is ideal.", timestamp: "2026-08-04T14:10:00-04:00" },
    { pollId: "POLL-2026-001", name: "Sam Wilson", id: "CM40000", option: "Option 1", comment: "", timestamp: "2026-08-04T15:25:00-04:00" },
    { pollId: "POLL-2026-001", name: "Bucky Barnes", id: "CM19170", option: "Option 3", comment: "Just make sure the radio works.", timestamp: "2026-08-04T16:00:00-04:00" },
    { pollId: "POLL-2026-001", name: "Scott Lang", id: "CM12344", option: "Option 1", comment: "", timestamp: "2026-08-04T16:50:00-04:00" },
    { pollId: "POLL-2026-001", name: "Hope VanDyne", id: "CM99988", option: "Option 1", comment: "", timestamp: "2026-08-04T17:10:00-04:00" },
    { pollId: "POLL-2026-001", name: "Carol Danvers", id: "CM90001", option: "Option 1", comment: "Higher, further, faster. Full support.", timestamp: "2026-08-04T18:00:00-04:00" },
    { pollId: "POLL-2026-001", name: "T'Challa King", id: "CM44000", option: "Option 1", comment: "For the safety of the airport operation.", timestamp: "2026-08-04T19:05:00-04:00" },
    { pollId: "POLL-2026-001", name: "Stephen Strange", id: "CM00100", option: "Option 2", comment: "A logical split of resources.", timestamp: "2026-08-04T20:20:00-04:00" },

    // Poll 2025-004 (Closed, 48 votes)
    ...Array.from({ length: 48 }, (_, i) => ({
        pollId: "POLL-2025-004",
        name: `Voter ${i + 1}`,
        id: `CM998${String(i).padStart(2, '0')}`,
        option: i % 5 === 0 ? "Option 1" : (i % 5 === 4 ? "Option 3" : "Option 2"), // Option 2 (14 hrs) wins majority
        comment: i % 12 === 0 ? "Need rest rules formalized." : "",
        timestamp: "2026-01-22T10:00:00-05:00"
    }))
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

// --- Data Synchronization (localStorage) ---
function loadDataFromStorage() {
    const storedIssues = localStorage.getItem('jfk_ops_issues');
    const storedPolls = localStorage.getItem('jfk_ops_polls');
    const storedVotes = localStorage.getItem('jfk_ops_votes');

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

function resetDemoData() {
    const doubleConfirm = confirm(
        "⚠️ DANGER: This will permanently WIPE OUT all database data, including all issues, voting polls, coordinator ballots, and progress history. You will start with a completely clean, empty application.\n\nAre you absolutely sure you want to proceed with this wipe?"
    );
    if (doubleConfirm) {
        // Clear storage keys and set to empty arrays so it starts from scratch
        localStorage.setItem('jfk_ops_issues', JSON.stringify([]));
        localStorage.setItem('jfk_ops_polls', JSON.stringify([]));
        localStorage.setItem('jfk_ops_votes', JSON.stringify([]));
        
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
                        <span>Participation: <strong>${pVotes.length}</strong> / ${p.eligibleVoters} Coordinators (${Math.round((pVotes.length/p.eligibleVoters)*100)}%)</span>
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
function handleIssueSubmit(event) {
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
        date: new Date().toISOString(),
        category: category,
        title: title,
        description: description,
        impact: impact,
        examples: examples,
        proposedSolution: proposedSolution,
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
                note: `Issue request submitted by ${name} (ID: ${employeeId})`
            }
        ]
    };

    // Save to list
    issues.push(newIssue);
    saveIssuesToStorage();

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
                        Participation: <strong>${pVotes.length}</strong> / ${p.eligibleVoters} Crewmembers (${Math.round((pVotes.length / p.eligibleVoters)*100)}%)
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
                    <span class="results-meta-item">Eligible Voters: <span class="results-meta-val">${p.eligibleVoters}</span></span>
                    <span class="results-meta-item">Votes Received: <span class="results-meta-val">${pVotes.length}</span></span>
                    <span class="results-meta-item">Participation: <span class="results-meta-val">${Math.round((pVotes.length / p.eligibleVoters) * 100)}%</span></span>
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
            <td>${ir.name}</td>
            <td><span class="font-mono text-muted" style="font-size:12.5px;">${ir.id}</span></td>
            <td><span class="badge badge-priority-${ir.priority.toLowerCase()}">${ir.priority}</span></td>
            <td><span class="badge badge-status-${ir.status.toLowerCase().replace(/ /g, '-')}">${ir.status}</span></td>
            <td style="font-family:var(--font-mono); font-size:12px;">${ir.followUpDate ? new Date(ir.followUpDate).toLocaleDateString() : '—'}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-xs btn-outline" onclick="openViewIssueModal('${ir.irNumber}')">View</button>
                    <button class="btn btn-xs btn-primary" onclick="openManageIssueModal('${ir.irNumber}')">Manage</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No matching requests found in database.</td></tr>';
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

function handleCreatePoll(event) {
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
    const eligibleVoters = parseInt(document.getElementById('poll-eligible-voters').value) || 68;

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

    polls.push(newPoll);
    savePollsToStorage();

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
            saveIssuesToStorage();
        }
    }

    alert(`Poll ${pollId} created successfully and marked as active.`);
    document.getElementById('admin-create-poll-form').reset();
    loadAdminPage();
}

function loadAdminPollsList() {
    const list = document.getElementById('admin-polls-list-rows');
    list.innerHTML = '';

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
                        <span>Eligible: <strong>${p.eligibleVoters}</strong></span> | 
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

function togglePollStatus(pollId, newStatus) {
    const poll = polls.find(p => p.pollId === pollId);
    if (poll) {
        poll.status = newStatus;
        savePollsToStorage();
        loadAdminPage();
    }
}

function resetPollVotes(pollId) {
    if (confirm(`Are you absolutely sure you want to wipe all registered voter ballots for poll ${pollId}? This cannot be undone.`)) {
        votes = votes.filter(v => v.pollId !== pollId);
        saveVotesToStorage();
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

function deleteIndividualVote(pollId, cmId, timestamp) {
    if (confirm(`Do you want to reset the vote submission for Crewmember ID ${cmId} on poll ${pollId}? This will allow the crewmember to re-vote.`)) {
        votes = votes.filter(v => !(v.pollId === pollId && v.id === cmId && v.timestamp === timestamp));
        saveVotesToStorage();
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

    const html = `
        <div class="details-grid">
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

// Admin Edit Status Modal
function openManageIssueModal(irNumber) {
    const ir = issues.find(item => item.irNumber === irNumber);
    if (!ir) return;

    document.getElementById('modal-manage-ir-number').textContent = `Manage Request ${ir.irNumber}`;
    document.getElementById('manage-issue-idx').value = ir.irNumber;

    // Populate fields
    document.getElementById('manage-status').value = ir.status;
    document.getElementById('manage-priority').value = ir.priority;
    document.getElementById('manage-owner').value = ir.owner || '';
    document.getElementById('manage-followup-date').value = ir.followUpDate || '';
    document.getElementById('manage-next-action').value = ir.nextAction || '';
    document.getElementById('manage-leadership-response').value = ir.leadershipResponse || '';
    document.getElementById('manage-internal-notes').value = ir.notes || '';
    document.getElementById('manage-decision').value = ir.decisionSummary || '';

    openModal('modal-manage-issue');
}

function handleManageIssueSave(event) {
    event.preventDefault();

    const irNumber = document.getElementById('manage-issue-idx').value;
    const ir = issues.find(item => item.irNumber === irNumber);
    if (!ir) return;

    const oldStatus = ir.status;
    const newStatus = document.getElementById('manage-status').value;
    const newPriority = document.getElementById('manage-priority').value;

    ir.status = newStatus;
    ir.priority = newPriority;
    ir.owner = document.getElementById('manage-owner').value.trim();
    ir.followUpDate = document.getElementById('manage-followup-date').value;
    ir.nextAction = document.getElementById('manage-next-action').value.trim();
    ir.leadershipResponse = document.getElementById('manage-leadership-response').value.trim();
    ir.notes = document.getElementById('manage-internal-notes').value.trim();
    ir.decisionSummary = document.getElementById('manage-decision').value.trim();

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
            note: `Record fields updated by Admin`
        });
    }

    saveIssuesToStorage();
    closeModal('modal-manage-issue');
    alert(`Request ${irNumber} updated successfully.`);
    loadAdminPage();
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

function handleVoteSubmit(event) {
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

    votes.push(newVote);
    saveVotesToStorage();

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



    // 6. Admin subtab toggles
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-admin-tab');
            document.getElementById(`admin-tab-${targetTab}`).classList.add('active');
        });
    });
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
    
    // Set Year selector
    const yearSelect = document.getElementById('report-year-select');
    if (yearSelect) {
        let optionExists = false;
        for (let i = 0; i < yearSelect.options.length; i++) {
            if (yearSelect.options[i].value === String(currentYear)) {
                optionExists = true;
                break;
            }
        }
        if (optionExists) {
            yearSelect.value = String(currentYear);
        } else {
            yearSelect.value = '2026';
        }
    }
    
    // Set Quarter selector
    const quarterSelect = document.getElementById('report-quarter-select');
    if (quarterSelect) {
        quarterSelect.value = currentQuarter;
    }
}

// --- App Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    bindEvents();
    initCurrentQuarterSelector();
    
    // Initial UI state setup
    handleRoleChange();
    handleThemeChange();
    
    // Load default landing tab
    switchTab('dashboard');
});
