// Global Variables and Data Storage
let coins = parseInt(localStorage.getItem("studyCoins")) || 0;
let streak = parseInt(localStorage.getItem("studyStreak")) || 0;
let totalStudyTime = parseInt(localStorage.getItem("studyTime")) || 0;
let lastStudyDate = localStorage.getItem("studyDate") || null;
let todayStudyTime = parseInt(localStorage.getItem("todayStudyTime")) || 0;
let storedDailyGoal = parseInt(localStorage.getItem("dailyGoal")) || 180;
let level = calculateLevel(totalStudyTime);
let energy = parseInt(localStorage.getItem("studyEnergy")) || 100;
let longestSession = parseInt(localStorage.getItem("longestSession")) || 0;
let highestDaily = parseInt(localStorage.getItem("highestDaily")) || 0;
let loginStreak = parseInt(localStorage.getItem("loginStreak")) || 0;
let lastLoginDate = localStorage.getItem("lastLoginDate") || null;
let freezeCount = parseInt(localStorage.getItem("freezeCount")) || 0;
// studyHistory now stores minutes per subject per day
let studyHistory = JSON.parse(localStorage.getItem("studyHistory")) || {};
let taskList = JSON.parse(localStorage.getItem("taskList")) || [];
let minSessionDuration = parseInt(localStorage.getItem("minSessionDuration")) || 1;
let weeklyTotal = parseInt(localStorage.getItem("weeklyTotal")) || 0;
let lastWeeklyReset = localStorage.getItem("lastWeeklyReset") || null;
let sessionInterval = null, sessionStartTime = 0, sessionSeconds = 0;
let currentSubject = null, miniGameAnswerCorrect = 0;
let animationIntensity = 100; // For user control of animations

// New XP system variables
let xp = parseInt(localStorage.getItem("studyXP")) || 0;
let xpThreshold = parseInt(localStorage.getItem("xpThreshold")) || 100;

// Dummy Shop Items Data
let shopItemsData = [
  { id: "item1", name: "Extra Energy", description: "Boost your study energy by 20%", price: 50 },
  { id: "item2", name: "XP Boost", description: "Gain extra XP per minute of study", price: 100 },
  { id: "item3", name: "Premium Avatar", description: "Unlock a new avatar", price: 150 }
];

const dailyChallenges = [
  "Study 30 minutes of Maths today.",
  "Complete a 25-minute session in English.",
  "Review 20 minutes of IT theory.",
  "Spend 15 minutes reading Sanskrit literature.",
  "Complete a full session in SST."
];
const mentorTips = [
  "Focus on one subject at a time.",
  "Break your study sessions into intervals.",
  "Stay hydrated and take breaks.",
  "Celebrate small victories.",
  "Consistency beats intensity."
];
const puzzleQuestions = [
  { q: "Unscramble: 'odgc'", a: "dog" },
  { q: "Next in sequence: 2, 4, 8, 16, ?", a: "32" }
];

// Initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => { document.getElementById("introOverlay").style.display = "none"; }, 4000);
  createAbstractShapes();
  document.addEventListener("mousemove", createParticle);

  if(localStorage.getItem("darkMode") === "true"){
    document.body.classList.add("dark");
    document.getElementById("darkModeToggle").textContent = "Light Mode";
  }
  const savedTheme = localStorage.getItem("selectedTheme");
  if(savedTheme) { setTheme(savedTheme); }
  const storedAvatar = localStorage.getItem("userAvatar") || "avatar1";
  document.getElementById("currentAvatar").className = "avatar " + storedAvatar;
  document.getElementById("personalQuoteText").textContent = localStorage.getItem("personalQuote") || "";
  updateLoginStreak();
  awardDailyBonus();
  checkWeeklyReset();
  checkStreak();
  newQuote();
  updateMentorTip();
  updateUI();
  updateDailyProgress();
  updateCircularGoal();
  updateCalendar();
  updateStudyChart();
  updateRankTier();
  updateWeeklyDisplay();
  updateDynamicBackground();
  populateChecklist();
  updateDailyChallenge();
  populateShop();
  updateCountdown();
  animateStats();
  updateDailyRoutine(); // NEW: Update daily routine on load
  setInterval(newQuote, 30000);

  // Update daily routine every minute
  setInterval(updateDailyRoutine, 60000);
});

function calculateLevel(time) {
  return Math.floor(time / 60) + 1;
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const darkEnabled = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", darkEnabled);
  document.getElementById("darkModeToggle").textContent = darkEnabled ? "Light Mode" : "Dark Mode";
}
function setTheme(themeName) {
  document.body.classList.remove("dark", "blueTheme", "luxury");
  if(themeName === "dark") { document.body.classList.add("dark"); }
  else if(themeName === "blue") { document.body.classList.add("blueTheme"); }
  else if(themeName === "luxury") { document.body.classList.add("luxury"); }
  localStorage.setItem("selectedTheme", themeName);
  closeThemeModal();
}
function checkStreak() {
  const today = new Date().toLocaleDateString();
  if(lastStudyDate !== today) {
    if(lastStudyDate) {
      const last = new Date(lastStudyDate);
      const diffDays = Math.floor((new Date() - last) / (1000 * 60 * 60 * 24));
      if(diffDays > 1) { streak = 0; }
    }
    lastStudyDate = today;
    localStorage.setItem("studyDate", today);
    todayStudyTime = 0;
    localStorage.setItem("todayStudyTime", todayStudyTime);
  }
}
function selectSubject(subject) {
  currentSubject = subject;
  document.getElementById("currentSubject").textContent = subject;
}
function startSession() {
  if(!currentSubject) { alert("Please select a subject first!"); return; }
  if(sessionInterval) return;
  playSound("audioStart");
  sessionStartTime = Date.now();
  sessionInterval = setInterval(() => {
    const elapsed = Date.now() - sessionStartTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById("sessionTime").textContent = minutes + " min " + seconds + " sec";
    updateCountdown();
  }, 1000);
}
function stopSession() {
  if(!sessionInterval) return;
  clearInterval(sessionInterval);
  sessionInterval = null;
  playSound("audioStop");
  const elapsed = Date.now() - sessionStartTime;
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  if(minutes < minSessionDuration) {
    streak = 0;
    alert("Session too short! Streak reset to 0.");
  } else {
    if(todayStudyTime === 0) { streak++; launchConfetti(); }
  }
  totalStudyTime += minutes;
  todayStudyTime += minutes;
  const multiplier = 1 + (loginStreak * 0.1);
  coins += Math.floor(minutes * multiplier);
  energy = Math.max(energy - minutes, 0);
  const today = new Date().toLocaleDateString();
  // Initialize today's study history if not already done
  if (!studyHistory[today]) {
    studyHistory[today] = {SST: 0, Maths: 0, English: 0, IT: 0, Sanskrit: 0, Physics: 0, Chemistry: 0, Biology: 0};
  }
  // Add minutes to the current subject
  studyHistory[today][currentSubject] = (studyHistory[today][currentSubject] || 0) + minutes;
  localStorage.setItem("studyHistory", JSON.stringify(studyHistory));
  localStorage.setItem("studyCoins", coins);
  localStorage.setItem("studyStreak", streak);
  localStorage.setItem("studyTime", totalStudyTime);
  localStorage.setItem("todayStudyTime", todayStudyTime);
  localStorage.setItem("studyEnergy", energy);
  if(minutes > longestSession) { longestSession = minutes; localStorage.setItem("longestSession", longestSession); }
  if(todayStudyTime > highestDaily) { highestDaily = todayStudyTime; localStorage.setItem("highestDaily", highestDaily); }
  addWeeklyMinutes(minutes);
  
  // XP system: Award 10 XP per minute of study and check for level up
  let xpEarned = minutes * 10;
  xp += xpEarned;
  while (xp >= xpThreshold) {
    xp -= xpThreshold;
    level++;
    xpThreshold = Math.floor(xpThreshold * 1.2);
    showLevelUp();
    launchConfetti();
  }
  localStorage.setItem("studyXP", xp);
  localStorage.setItem("xpThreshold", xpThreshold);

  const newLevel = calculateLevel(totalStudyTime);
  if(newLevel > level) { 
    level = newLevel; 
    showLevelUp(); 
    launchConfetti(); 
  }
  updateUI();
  updateDailyProgress();
  updateCircularGoal();
  updateCalendar();
  updateStudyChart();
  updateRankTier();
  updateDynamicBackground();
  document.getElementById("sessionTime").textContent = "0 min 0 sec";
  maybeShowChest();
  triggerFloatingCoin(20);
  updateCountdown();
  animateStats();
}
function maybeShowChest() {
  if(Math.random() < 0.3) {
    const chest = document.getElementById("rewardChest");
    if(chest) { chest.style.display = "block"; setTimeout(() => { chest.style.display = "none"; }, 5000); }
  }
}
function openChest() {
  const chest = document.getElementById("rewardChest");
  if(chest) { chest.style.display = "none"; }
  const bonus = Math.floor(Math.random() * 11) + 5;
  coins += bonus;
  alert("You earned " + bonus + " bonus coins!");
  localStorage.setItem("studyCoins", coins);
  updateUI();
  triggerCoinAnimation();
}
function awardDailyBonus() {
  const bonusAwarded = localStorage.getItem("dailyBonusAwarded");
  const today = new Date().toLocaleDateString();
  if(bonusAwarded !== today) {
    const bonus = 20 + (loginStreak * 5);
    coins += bonus;
    localStorage.setItem("studyCoins", coins);
    localStorage.setItem("dailyBonusAwarded", today);
    alert("Daily Login Bonus: You received " + bonus + " bonus coins!");
  }
}
function updateLoginStreak() {
  const today = new Date().toLocaleDateString();
  if(lastLoginDate === today) return;
  else {
    if(lastLoginDate) {
      const last = new Date(lastLoginDate);
      const diffDays = Math.floor((new Date() - last) / (1000 * 60 * 60 * 24));
      loginStreak = (diffDays === 1) ? loginStreak + 1 : 1;
    } else { loginStreak = 1; }
    lastLoginDate = today;
    localStorage.setItem("lastLoginDate", today);
    localStorage.setItem("loginStreak", loginStreak);
  }
}
function updateUI() {
  document.getElementById("coinCount").textContent = coins;
  document.getElementById("streakCount").textContent = streak;
  document.getElementById("timeCount").textContent = totalStudyTime;
  document.getElementById("levelCount").textContent = level;
  document.getElementById("todayStudy").textContent = todayStudyTime;
  document.getElementById("dailyGoalDisplay").textContent = storedDailyGoal;
  document.getElementById("energyCount").textContent = energy;
  // Update XP display
  document.getElementById("xpCount").textContent = xp;
  document.getElementById("xpThreshold").textContent = xpThreshold;
  updateXPProgress();
}
function updateDailyProgress() {
  const percent = Math.min((todayStudyTime / storedDailyGoal) * 100, 100);
  document.getElementById("dailyProgressBar").style.width = percent + "%";
  document.getElementById("circularGoal").style.setProperty("--progress", percent);
  if(percent === 100) { showFireworks(); }
}
function updateCircularGoal() {
  const percent = Math.min((todayStudyTime / storedDailyGoal) * 100, 100);
  document.getElementById("circularGoal").style.setProperty("--progress", percent);
}
function setDailyGoal() {
  const newGoal = parseInt(document.getElementById("dailyGoalInput").value);
  if(newGoal > 0) {
    storedDailyGoal = newGoal;
    localStorage.setItem("dailyGoal", storedDailyGoal);
    updateDailyProgress();
    updateUI();
  } else { alert("Please enter a valid number."); }
}
function setMinSession() {
  const newMin = parseInt(document.getElementById("minSessionInput").value);
  if(newMin > 0) {
    minSessionDuration = newMin;
    localStorage.setItem("minSessionDuration", minSessionDuration);
    alert("Minimum session duration set to " + minSessionDuration + " minutes.");
  } else { alert("Please enter a valid number."); }
}
function newQuote() {
  const quotes = [
    "You are nothing, and no one cares, so rise up now and climb the stairs.", // 1
    "You have no value, no worth, no name, till you step up and change the game.", // 2
    "No one is coming, no one will try, it's up to you to touch the sky.", // 3
    "You are unseen, unknown, unheard, till success makes them eat their words.", // 4
    "They don’t ignore you because they’re busy, you’re just a ghost, forgotten so easy.", // 5
    "No one believes in the words you say, they trust in results, so lead the way.", // 6
    "You are replaceable, forgettable, gone, unless you fight and prove them wrong.", // 7
    "The world is brutal, unfair, and cold, only the strong will rise and hold.", // 8
    "If you disappeared right now, today, not one person would change their way.", // 9
    "Your pain is a joke, your loss is fun, but they’ll regret it when you’ve won.", // 10
    "They’ll laugh at your fall, then beg at your feet, once you rise and never retreat.", // 11
    "Nobody bows to the weak and lost, so build yourself no matter the cost.", // 12
    "They forgot your name, they left with ease, make them regret it—bring them to their knees.", // 13
    "You cry at night, they sleep just fine, so why not grind and make life shine?", // 14
    "Your tears are fuel, your rage is fire, let it burn and take you higher.", // 15
    "No one claps when you start the race, they only cheer when you take first place.", // 16
    "Dreams mean nothing without the sweat, get up now, there's time left yet.", // 17
    "They never cared, they never will, so show them pain and break their will.", // 18
    "The world is blind to silent cries, but it bows to those who rise.", // 19
    "You were an option, a game, a joke, now be the fire that makes them choke.", // 20
    "They left you behind without a glance, now take your pain and learn to dance.", // 21
    "You beg for love, for time, for grace, they left without a second's trace.", // 22
    "Stop chasing ghosts, stop wishing for light, be the storm that owns the night.", // 23
    "You sat and prayed, but nothing came, now work so hard they fear your name.", // 24
    "No one cares if you break or fall, but they will when you have it all.", // 25
    "You are weak, a shadow, a stain, till you rise and take the reins.", // 26
    "They used you, played you, threw you away, now show them hell and make them pay.", // 27
    "You're soft, you're slow, you're stuck, you're lost, so build a beast no matter the cost.", // 28
    "No one checks if you're dead or alive, till you succeed and start to thrive.", // 29
    "Crying won’t fix it, pain won't fade, only hard work turns dark to day.", // 30
    "They won't text back, they won't regret, but they will when you’re what they can’t forget.", // 31
    "Your comfort is a trap, your doubts are chains, break them all and forge new gains.", // 32
    "They smirk, they mock, they call you weak, but soon they'll beg to hear you speak.", // 33
    "You lost the fight, you lost your pride, now train so hard they step aside.", // 34
    "They never saw you, never cared, now let success be your revenge declared.", // 35
    "The world is cruel, the world is wild, so turn your pain into something styled.", // 36
    "You waited, wasted, sat so still, now move so fast you break their will.", // 37
    "Excuses are a fool’s best friend, drop them all or meet your end.", // 38
    "Your heart is broken, your soul is sore, now use that pain and build some more.", // 39
    "No more love, no more hope, just discipline will help you cope.", // 40
    "They ghosted you, they walked away, now grind so hard they beg to stay.", // 41
    "You chase them down, they just ignore, now chase success and beg no more.", // 42
    "They’ll only miss you when you’re gone, so build a life and prove them wrong.", // 43
    "No one is watching, no one cares, till they see you climb the stairs.", // 44
    "Be the nightmare they never knew, work so hard they envy you.", // 45
    "Let your rage become your wings, let the struggle forge your kings.", // 46
    "You are nothing, you are dust, till you rise and earn their trust.", // 47
    "Drown in sorrow, drown in pain, or swim to shore and rise again.", // 48
    "They love to doubt, they love to hate, now rise so high it’s far too late.", // 49
    "Forget their words, forget their face, you only need the will to race.", // 50
    "No one saves you, no one tries, only you can touch the skies.", // 51
    "Make your name, make your mark, or fade away into the dark.", // 52
    "No one listens, no one sees, till you bring them to their knees.", // 53
    "They doubted, they laughed, they turned away, now own your world and make them pay.", // 54
    "Your weakness feeds their hungry pride, now rise so strong they run and hide.", // 55
    "Be the legend they once ignored, write your fate with sweat and sword.", // 56
    "No one waits, no one stops, only kings stand at the tops.", // 57
    "Be the beast they couldn’t tame, work so hard they chant your name.", // 58
    "The past is gone, the time is now, step up strong and take a vow.", // 59
    "They left, they ran, they found someone new, now show them what they really threw.", // 60
    "You're not forgotten, just unseen, now build yourself into a machine.", // 61
    "Stop complaining, start the war, fight so hard they beg for more.", // 62
    "They left you weak, they left you cold, now carve success in solid gold.", // 63
    "No one gives you what you crave, so fight for it and misbehave.", // 64
    "Your mind is weak, your soul is tired, now light the flame and get inspired.", // 65
    "Your scars are proof of lessons learned, now use them all for power earned.", // 66
    "You begged, you cried, you tore apart, now use that pain to forge your heart.", // 67
    "Be the ghost they fear at night, haunt their world with blinding light.", // 68
    "They moved on, they’re doing fine, so work so hard they wish you’d shine.", // 69
    "They never called, they never cared, so build a throne and take your chair.", // 70
    "They don’t check on you, they never will, so build yourself with iron will.", // 71
    "You wait for a sign, you beg for a clue, but no one is watching, it’s all up to you.", // 72
    "You were an afterthought, a waste of space, now make your name impossible to replace.", // 73
    "They don’t love you, they love control, so break the chains and take your role.", // 74
    "If you sit and cry, you’ll die unknown, so grind until your name is shown.", // 75
    "No one pities the man who waits, the world rewards those who dominate.", // 76
    "They walk right past you, don’t even stare, but soon your success will make them care.", // 77
    "You were an option, they chose to ignore, now become the person they beg to adore.", // 78
    "If you don’t move, you stay the same, so step up strong and own your name.", // 79
    "Tears won’t build you, pain won’t stay, unless you use it to pave your way.", // 80
    "They left without looking back, now grind so hard they fade to black.", // 81
    "The weak complain, the strong persist, so fight each day and never resist.", // 82
    "You are a ghost, unseen, unheard, so rise with action, not empty words.", // 83
    "They celebrate while you feel pain, but one day soon, you’ll own the game.", // 84
    "No one will give you what you seek, take it now, don’t be weak.", // 85
    "You crave revenge, you crave their tears, but success is what they’ll truly fear.", // 86
    "Don’t just exist, refuse to crawl, stand up now and have it all.", // 87
    "If you fail, they’ll mock, they’ll cheer, so make them regret each wasted year.", // 88
    "You loved too much, you gave your best, they walked away—now pass their test.", // 89
    "No one’s watching, no one waits, you either build or seal your fate.", // 90
    "You fell apart, they didn’t blink, now let success be what they think.", // 91
    "They will forget you if you fail, so fight your war, set your sail.", // 92
    "No one notices broken dreams, but they all bow when power screams.", // 93
    "They replaced you fast, moved right along, now be so great they know they were wrong.", // 94
    "They said you couldn’t, they laughed out loud, so shut them up, make yourself proud.", // 95
    "You waste your time on love and sorrow, but will they care for you tomorrow?", // 96
    "They had their chance, they let you go, so rise above, put on a show.", // 97
    "Your pain is fuel, your loss is fire, burn the past, build something higher.", // 98
    "No one checks if you’re alright, but they’ll show up when you shine bright.", // 99
    "They never loved you, not at all, they loved control and watched you fall.", // 100
    "You sit and wish, you wait and cry, but nothing changes till you try.", // 101
    "Be the fire, burn the chains, let their absence fuel your gains.", // 102
    "They left you behind, they cut the ties, now be the king that rules the skies.", // 103
    "You were a joke, a backup plan, now be the beast they cannot stand.", // 104
    "If you beg, you stay the same, demand success, rewrite your name.", // 105
    "They took you for granted, threw you away, now make them suffer every day.", // 106
    "No more love, no more grace, build a monster they cannot replace.", // 107
    "You were the fool, blind and weak, now let them choke when you reach your peak.", // 108
    "You wait for them, they move ahead, stop chasing ghosts, grind instead.", // 109
    "They used you up, they watched you break, now show them all their worst mistake.", // 110
    "The world is cold, the rules are set, the strong survive, the weak regret.", // 111
    "No second chances, no second tries, you win or lose beneath these skies.", // 112
    "Forget their names, forget their past, grind so hard you’ll always last.", // 113
    "They used your kindness, drained your soul, now build yourself and take control.", // 114
    "No one cares, no one stays, so build a life that goes both ways.", // 115
    "Be the legend they threw away, the storm they feared but couldn’t stay.", // 116
    "You watched them love, you watched them shine, now take your pain and make it mine.", // 117
    "They won’t regret it if you stay down, so rise up now and take your crown.", // 118
    "You begged them once, you cried, you bled, now make them wish that they were dead.", // 119
    "No more sorrow, no more pain, just brutal strength and endless gain.", // 120
    "No one gave you what you need, so fight like hell, make yourself bleed.", // 121
    "They don’t deserve the tears you weep, now let your discipline run deep.", // 122
    "You had your moment, you had your fall, now be the king who owns it all.", // 123
    "Pain is fleeting, weakness stays, so kill the past and change your ways.", // 124
    "They thought you’d break, they thought you’d quit, now show them all what legends get.", // 125
    "No one’s watching, no one cares, until you win and they compare.", // 126
    "Stop the waiting, stop the pain, grab success and let it reign.", // 127
    "They turned their back, they walked away, now build a world where they can’t stay.", // 128
    "No more doubts, no more regret, today’s the day you don’t forget.", // 129
    "Be the storm, destroy the past, build a life that’s built to last.", // 130
    "If you give up, you stay the same, now own your fate and change the game.", // 131
    "They laughed, they mocked, they walked away, now grind so hard they fade to grey.", // 132
    "No second thoughts, no wasted breath, fight so hard they fear your death.", // 133
    "You were the fool, the blind, the weak, now rise up high, let vengeance speak.", // 134
    "No more excuses, no more delay, dominate now or fade away.", // 135
    "They won’t regret it if you fail, but they will when you prevail.", // 136
    "You sat in pain, you begged to stay, now let that fire burn the way.", // 137
    "No one saves you, no one tries, be the legend that survives.", // 138
    "They replaced you fast, they let you go, now grind until they never know.", // 139
    "The ones you love will walk away, so make success the one that stays.", // 140
    "They never checked, they never asked, now build a future that will last.", // 141
    "You cry, you beg, you hope, you wait, but no one’s coming—it’s too late.", // 142
    "They found someone new, they’re doing fine, now make them wish that you still shine.", // 143
    "You sit in silence, lost in pain, while winners grind and build their name.", // 144
    "They left, they laughed, they walked away, now build success that makes them pay.", // 145
    "No one’s looking, no one cares, till you succeed and climb the stairs.", // 146
    "You broke, you bent, you almost quit, now show the world you’ll never sit.", // 147
    "Your dreams mean nothing if you wait, so start right now and choose your fate.", // 148
    "You beg, you plead, you wish they’d stay, but strong men walk the other way.", // 149
    "They gave up on you without a fight, now let success bring them to light.", // 150
    "You waste your time on those who left, now take revenge and be your best.", // 151
    "No one saves you, no one tries, only legends touch the skies.", // 152
    "They won’t regret it if you stay the same, but they will when you change the game.", // 153
    "You waited years for them to see, now build a life where they won’t be.", // 154
    "They said you’re nothing, they made it clear, so work so hard they disappear.", // 155
    "You pray, you hope, you wish they knew, but the truth is—they never do.", // 156
    "You gave them time, you gave them love, they gave you pain—so rise above.", // 157
    "They forgot your name, they let you go, now let success become your glow.", // 158
    "You sat in sadness, drowning slow, but winners rise and let it go.", // 159
    "They didn’t care, they never will, so climb the top and show your skill.", // 160
    "You gave your heart, you gave your trust, now let them choke on what they crushed.", // 161
    "They said you couldn’t, they said you won’t, now prove them wrong until they don’t.", // 162
    "You waste your nights on what they did, but they forgot you—so make them wish.", // 163
    "They watch you suffer, they watch you fall, now rise and own it all.", // 164
    "You let them win, you let them break, but now it’s time to raise the stakes.", // 165
    "They took your love, they let it rot, now make them beg for what they lost.", // 166
    "You’re nothing now, just dust, just air, so make them wish that they still cared.", // 167
    "No one listens, no one sees, till they’re bowing on their knees.", // 168
    "You gave them effort, they gave you lies, now make them pay when you rise.", // 169
    "You miss their voice, you miss their touch, but they moved on, they don’t miss much.", // 170
    "No more love, no more games, only power, only flames.", // 171
    "They said forever, but they lied, now build a kingdom and let them cry.", // 172
    "They wanted fun, they wanted free, but you want power—so let it be.", // 173
    "You beg for closure, you beg for peace, but only success will make pain cease.", // 174
    "They looked away, they let you break, now make them wish for one mistake.", // 175
    "Your weakness made them laugh and grin, now kill it all and choose to win.", // 176
    "You were soft, you let them play, now make them beg to hear your name.", // 177
    "The world is cruel, the world is fast, so move ahead or stay the past.", // 178
    "They left you dry, they left you cold, now turn that pain into solid gold.", // 179
    "They don’t deserve the tears you weep, now let your discipline run deep.", // 180
    "They watched you break, they watched you fold, now grind until they fear your soul.", // 181
    "They said you’re weak, they laughed out loud, now shut them up, make yourself proud.", // 182
    "You cry at night, you shake in pain, but only action breaks the chain.", // 183
    "No one’s waiting, no one calls, so build a life that breaks their walls.", // 184
    "They moved on, they never looked back, now build a future they’ll never crack.", // 185
    "You lost, you failed, you took the hit, now get back up and never quit.", // 186
    "You begged for time, you begged for love, but they just watched—so rise above.", // 187
    "You sat in darkness, cold and weak, now chase success and let it speak.", // 188
    "No one listens, no one cares, till you stand tall above the stairs.", // 189
    "Be the fire, burn the chains, let their absence fuel your gains.", // 190
    "They walked away, they broke your trust, now show them all that rise you must.", // 191
    "Your scars are proof of battles lost, but strength is built through pain’s great cost.", // 192
    "They wrote you off, they turned their back, now build yourself and never slack.", // 193
    "They said you’re nothing, they said you’re done, now make them see you’ve just begun.", // 194
    "You spent too long in fear and doubt, now let them choke as you climb out.", // 195
    "You begged, you cried, you tried to stay, but now it’s time to walk away.", // 196
    "You gave them power, you let them win, now take it back and start again.", // 197
    "No more waiting, no more cries, just power, hunger, and sharp replies.", // 198
    "They never cared, they never tried, now let your greatness kill their pride.", // 199
    "Your tears won’t change the past you see, but victory makes them wish to be.", // 200
  
      
  ];
  const randIndex = Math.floor(Math.random() * quotes.length);
  document.getElementById("quoteText").textContent = quotes[randIndex] ;
}
function savePersonalQuote() {
  const quote = document.getElementById("quoteInput").value;
  localStorage.setItem("personalQuote", quote );
  document.getElementById("personalQuoteText").textContent = quote ;
  alert("Personal quote saved!");
}
function showLevelUp() {
  const levelDiv = document.getElementById("levelUp");
  levelDiv.classList.add("show");
  playSound("audioLevelUp");
  setTimeout(() => { levelDiv.classList.remove("show"); }, 3000);
}
function playSound(id) { document.getElementById(id).play(); }
function triggerCoinAnimation() {
  const coinIcon = document.querySelector(".coinIcon");
  coinIcon.classList.add("animateCoin");
  setTimeout(() => { coinIcon.classList.remove("animateCoin"); }, 500);
}
function triggerFloatingCoin(size) {
  const coin = document.createElement("div");
  coin.className = "floatingCoin";
  coin.style.left = "50%";
  coin.style.top = "50%";
  coin.textContent = "🪙";
  document.body.appendChild(coin);
  setTimeout(() => { coin.remove(); }, 1000);
}
function updateRankTier() {
  let rank = "Bronze";
  if(level >= 20) rank = "Diamond";
  else if(level >= 15) rank = "Platinum";
  else if(level >= 10) rank = "Gold";
  else if(level >= 5) rank = "Silver";
  document.getElementById("rankTier").textContent = rank;
}
function updateMentorTip() {
  const tip = mentorTips[Math.floor(Math.random() * mentorTips.length)];
  document.getElementById("mentorTip").textContent = tip;
}
function refreshDailyChallenge() {
  const today = new Date().toLocaleDateString();
  const newChal = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
  localStorage.setItem("dailyChallenge_" + today, newChal);
  document.getElementById("dailyChallengeText").textContent = newChal;
}
function updateDailyChallenge() {
  const today = new Date().toLocaleDateString();
  let storedChallenge = localStorage.getItem("dailyChallenge_" + today);
  if(!storedChallenge) {
    storedChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    localStorage.setItem("dailyChallenge_" + today, storedChallenge);
  }
  document.getElementById("dailyChallengeText").textContent = storedChallenge;
}
function shareProgress() {
  const shareData = {
    title: 'My StudyAddict Progress',
    text: `I've studied ${totalStudyTime} minutes and reached level ${level}!`,
    url: window.location.href
  };
  if(navigator.share) { navigator.share(shareData); }
  else { navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`); alert("Progress copied to clipboard!"); }
}
function giveFeedback() {
  const feedback = prompt("Please share your feedback:");
  if(feedback) {
    const feedbackMsg = document.createElement("div");
    feedbackMsg.textContent = "Thank you for your feedback!";
    feedbackMsg.style.position = "fixed";
    feedbackMsg.style.top = "50%";
    feedbackMsg.style.left = "50%";
    feedbackMsg.style.transform = "translate(-50%, -50%)";
    feedbackMsg.style.background = "var(--primary-color)";
    feedbackMsg.style.color = "#fff";
    feedbackMsg.style.padding = "20px";
    feedbackMsg.style.borderRadius = "8px";
    feedbackMsg.style.zIndex = "500";
    feedbackMsg.style.opacity = "0";
    feedbackMsg.style.transition = "opacity 0.5s";
    document.body.appendChild(feedbackMsg);
    setTimeout(() => { feedbackMsg.style.opacity = "1"; }, 100);
    setTimeout(() => { feedbackMsg.remove(); }, 2000);
  }
}
function setReminder() {
  if(!("Notification" in window)) { alert("This browser does not support notifications."); return; }
  Notification.requestPermission().then(permission => { if(permission === "granted") { new Notification("Study Reminder", { body: "Time to study and level up!" }); } });
}
function openMiniGame() { document.getElementById("miniGameModal").style.display = "flex"; document.getElementById("miniGameModal").classList.add("show"); generateMiniGameQuestion(); }
function closeMiniGame() { document.getElementById("miniGameModal").style.display = "none"; document.getElementById("miniGameModal").classList.remove("show"); document.getElementById("miniGameResult").textContent = ""; document.getElementById("miniGameAnswer").value = ""; }
function generateMiniGameQuestion() { const maxNum = 10 + (level * 2); const a = Math.floor(Math.random() * maxNum) + 1; const b = Math.floor(Math.random() * maxNum) + 1; miniGameAnswerCorrect = a + b; document.getElementById("miniGameQuestion").textContent = `What is ${a} + ${b}?`; }
function submitMiniGame() { const ans = parseInt(document.getElementById("miniGameAnswer").value); const resultP = document.getElementById("miniGameResult"); if(ans === miniGameAnswerCorrect) { resultP.textContent = "Correct! Well done."; coins += 10; localStorage.setItem("studyCoins", coins); updateUI(); } else { resultP.textContent = "Oops, try again!"; } }
function openPuzzleGame() { document.getElementById("puzzleModal").style.display = "flex"; document.getElementById("puzzleModal").classList.add("show"); generatePuzzleQuestion(); }
function closePuzzleGame() { document.getElementById("puzzleModal").style.display = "none"; document.getElementById("puzzleModal").classList.remove("show"); document.getElementById("puzzleResult").textContent = ""; document.getElementById("puzzleAnswer").value = ""; }
function generatePuzzleQuestion() { const puzzle = puzzleQuestions[Math.floor(Math.random() * puzzleQuestions.length)]; document.getElementById("puzzleQuestion").textContent = puzzle.q; document.getElementById("puzzleModal").dataset.answer = puzzle.a; }
function submitPuzzleGame() { const ans = document.getElementById("puzzleAnswer").value.toLowerCase().trim(); const correct = document.getElementById("puzzleModal").dataset.answer; const resultP = document.getElementById("puzzleResult"); if(ans === correct) { resultP.textContent = "Correct!"; coins += 15; localStorage.setItem("studyCoins", coins); updateUI(); } else { resultP.textContent = "Incorrect, try again!"; } }
function openChecklist() { document.getElementById("checklistModal").style.display = "flex"; }
function closeChecklist() { document.getElementById("checklistModal").style.display = "none"; }
function addTask() { const task = document.getElementById("newTaskInput").value; if(task.trim() !== "") { taskList.push(task); localStorage.setItem("taskList", JSON.stringify(taskList)); populateChecklist(); document.getElementById("newTaskInput").value = ""; } }
function populateChecklist() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  taskList.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = task;
    li.style.cursor = "pointer";
    li.classList.add("slideIn");
    li.onclick = () => { if(confirm("Remove this task?")) { taskList.splice(index, 1); localStorage.setItem("taskList", JSON.stringify(taskList)); populateChecklist(); } };
    list.appendChild(li);
  });
}
function openMindfulness() { document.getElementById("mindfulnessModal").style.display = "flex"; }
function closeMindfulness() { document.getElementById("mindfulnessModal").style.display = "none"; }
function addWeeklyMinutes(minutes) { weeklyTotal += minutes; localStorage.setItem("weeklyTotal", weeklyTotal); if(weeklyTotal >= 300) { alert("Weekly Mission Completed! You've earned 50 bonus coins!"); coins += 50; localStorage.setItem("studyCoins", coins); } updateWeeklyDisplay(); }
function updateWeeklyDisplay() { const weeklyEl = document.getElementById("weeklyTotal"); if(weeklyEl) { weeklyEl.textContent = weeklyTotal; } }
function checkWeeklyReset() {
  const today = new Date().toLocaleDateString();
  if(lastWeeklyReset !== today) { weeklyTotal = 0; localStorage.setItem("weeklyTotal", weeklyTotal); lastWeeklyReset = today; localStorage.setItem("lastWeeklyReset", today); }
}
function updateCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
  for(let i = 6; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    let totalMinutes = 0;
    if(studyHistory[dateStr]) {
      for(const subj in studyHistory[dateStr]) {
        totalMinutes += studyHistory[dateStr][subj];
      }
    }
    const cell = document.createElement("div");
    cell.className = "calendarCell";
    cell.innerHTML = `<strong>${dateStr}</strong><br>${totalMinutes} min`;
    grid.appendChild(cell);
  }
}
function updateStudyChart() {
  const labels = [];
  const dataSST = [];
  const dataMaths = [];
  const dataEnglish = [];
  const dataIT = [];
  const dataSanskrit = [];
  const dataPhysics = [];
  const dataChemistry = [];
  const dataBiology = [];

  // For each of the last 7 days, generate dummy data if no study history exists.
  for(let i = 6; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    labels.push(dateStr);
    if(!studyHistory[dateStr]) {
      // Dummy values for demonstration
      studyHistory[dateStr] = {
        SST: Math.floor(Math.random()*10),
        Maths: Math.floor(Math.random()*10),
        English: Math.floor(Math.random()*10),
        IT: Math.floor(Math.random()*10),
        Sanskrit: Math.floor(Math.random()*10),
        Physics: Math.floor(Math.random()*10),
        Chemistry: Math.floor(Math.random()*10),
        Biology: Math.floor(Math.random()*10)
      }; }
    dataSST.push(studyHistory[dateStr].SST);
    dataMaths.push(studyHistory[dateStr].Maths);
    dataEnglish.push(studyHistory[dateStr].English);
    dataIT.push(studyHistory[dateStr].IT);
    dataSanskrit.push(studyHistory[dateStr].Sanskrit);
    dataPhysics.push(studyHistory[dateStr].Physics);
    dataChemistry.push(studyHistory[dateStr].Chemistry);
    dataBiology.push(studyHistory[dateStr].Biology);
  }
  localStorage.setItem("studyHistory", JSON.stringify(studyHistory));
  
  const canvas = document.getElementById("studyChart");
  if (!canvas) {
    console.error("Canvas element with id 'studyChart' not found.");
    return;
  }
  const ctx = canvas.getContext("2d");
  // Safely destroy previous chart if it exists and destroy is a function
  if(window.studyChart && typeof window.studyChart.destroy === 'function'){
    window.studyChart.destroy();
  } else {
    window.studyChart = null;
  }
  window.studyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'SST', data: dataSST, backgroundColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgba(255, 99, 132, 1)' },
        { label: 'Maths', data: dataMaths, backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)' },
        { label: 'English', data: dataEnglish, backgroundColor: 'rgba(75, 192, 192, 0.5)', borderColor: 'rgba(75, 192, 192, 1)' },
        { label: 'IT', data: dataIT, backgroundColor: 'rgba(153, 102, 255, 0.5)', borderColor: 'rgba(153, 102, 255, 1)' },
        { label: 'Sanskrit', data: dataSanskrit, backgroundColor: 'rgba(255, 159, 64, 0.5)', borderColor: 'rgba(255, 159, 64, 1)' },
        { label: 'Physics', data: dataPhysics, backgroundColor: 'rgba(255, 206, 86, 0.5)', borderColor: 'rgba(255, 206, 86, 1)' },
        { label: 'Chemistry', data: dataChemistry, backgroundColor: 'rgba(99, 255, 132, 0.5)', borderColor: 'rgba(99, 255, 132, 1)' },
        { label: 'Biology', data: dataBiology, backgroundColor: 'rgba(153, 255, 102, 0.5)', borderColor: 'rgba(153, 255, 102, 1)' }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      animation: { duration: 1000 }
    }
  });
}
function updateDynamicBackground() {
  const hue = totalStudyTime % 360;
  document.body.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 90%), hsl(${(hue + 30) % 360}, 70%, 80%))`;
}
function openSearchOverlay() { document.getElementById("searchOverlay").style.display = "flex"; document.getElementById("searchInput").focus(); }
function closeSearchOverlay() { document.getElementById("searchOverlay").style.display = "none"; }
function openThemeModal() { document.getElementById("themeModal").style.display = "block"; document.getElementById("themeModal").classList.add("show"); }
function closeThemeModal() { document.getElementById("themeModal").style.display = "none"; document.getElementById("themeModal").classList.remove("show"); }
function openSettingsModal() { document.getElementById("settingsModal").style.display = "flex"; document.getElementById("settingsModal").classList.add("show"); }
function closeSettingsModal() { document.getElementById("settingsModal").style.display = "none"; document.getElementById("settingsModal").classList.remove("show"); }
function setDailyGoalFromSettings() {
  const newGoal = parseInt(document.getElementById("dailyGoalInputSettings").value);
  if(newGoal > 0) {
    storedDailyGoal = newGoal;
    localStorage.setItem("dailyGoal", storedDailyGoal);
    updateDailyProgress();
    updateUI();
    alert("Daily goal updated!");
  } else { alert("Please enter a valid number."); }
}
function setMinSessionFromSettings() {
  const newMin = parseInt(document.getElementById("minSessionInputSettings").value);
  if(newMin > 0) {
    minSessionDuration = newMin;
    localStorage.setItem("minSessionDuration", minSessionDuration);
    alert("Minimum session duration updated!");
  } else { alert("Please enter a valid number."); }
}
function openShopModal() { document.getElementById("shopModal").classList.add("show"); }
function closeShopModal() { document.getElementById("shopModal").classList.remove("show"); }
function populateShop() {
  const shopDiv = document.getElementById("shopItems");
  shopDiv.innerHTML = "";
  shopItemsData.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "shopItem";
    itemDiv.innerHTML = `<strong>${item.name}</strong><br>${item.description}<br>Price: ${item.price} coins<br><button onclick="purchaseItem('${item.id}', ${item.price})">Buy</button>`;
    shopDiv.appendChild(itemDiv);
  });
}
function purchaseItem(id, price) {
  if(coins < price) { alert("Not enough coins!"); return; }
  coins -= price;
  localStorage.setItem("studyCoins", coins);
  updateUI();
  alert("Purchased " + id + "!");
}
function launchConfetti() {
  const container = document.getElementById("confettiContainer");
  for(let i = 0; i < 30; i++){
    const confetti = document.createElement("div");
    confetti.style.position = "absolute";
    confetti.style.width = "10px";
    confetti.style.height = "10px";
    confetti.style.backgroundColor = `hsl(${Math.random()*360}, 70%, 60%)`;
    confetti.style.top = "-10px";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.opacity = Math.random();
    confetti.style.transform = `rotate(${Math.random()*360}deg)`;
    confetti.style.animation = "confettiDrop 3s ease-out forwards";
    container.appendChild(confetti);
    setTimeout(() => { confetti.remove(); }, 3000);
  }
}
function moduleRipple(e) {
  const module = e.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(module.clientWidth, module.clientHeight);
  const radius = diameter / 2;
  circle.style.width = diameter + "px";
  circle.style.height = diameter + "px";
  circle.style.left = (e.clientX - module.getBoundingClientRect().left - radius) + "px";
  circle.style.top = (e.clientY - module.getBoundingClientRect().top - radius) + "px";
  circle.classList.add("ripple");
  const existing = module.getElementsByClassName("ripple")[0];
  if(existing) { existing.remove(); }
  module.appendChild(circle);
}
function showFireworks() {
  const fireworks = document.getElementById("fireworks");
  fireworks.style.opacity = "1";
  setTimeout(() => { fireworks.style.opacity = "0"; }, 1000);
}
let eggClicks = 0;
function triggerEasterEgg() {
  eggClicks++;
  if(eggClicks >= 5) {
    alert("Easter Egg Found! You're unstoppable!");
    eggClicks = 0;
    createSparkles();
  }
}
function createParticle(e) {
  const particle = document.createElement("div");
  particle.className = "particle";
  particle.style.left = e.pageX + "px";
  particle.style.top = e.pageY + "px";
  document.body.appendChild(particle);
  setTimeout(() => { particle.remove(); }, 1000 * (animationIntensity / 100));
}
function createAbstractShapes() {
  const container = document.getElementById("abstractShapes");
  for(let i = 0; i < 10; i++){
    const shape = document.createElement("div");
    shape.className = "abstractShape";
    shape.style.width = (20 + Math.random() * 50) + "px";
    shape.style.height = (20 + Math.random() * 50) + "px";
    shape.style.top = Math.random() * 100 + "%";
    shape.style.left = Math.random() * 100 + "%";
    shape.style.animationDuration = (5 + Math.random() * 5) + "s";
    container.appendChild(shape);
  }
}
function createSparkles() {
  for(let i = 0; i < 20; i++){
    const sparkle = document.createElement("div");
    sparkle.className = "particle";
    sparkle.style.background = "gold";
    sparkle.style.left = Math.random() * window.innerWidth + "px";
    sparkle.style.top = Math.random() * window.innerHeight + "px";
    document.body.appendChild(sparkle);
    setTimeout(() => { sparkle.remove(); }, 1000);
  }
}
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
window.addEventListener("scroll", () => {
  const btn = document.getElementById("scrollTopButton");
  if(window.scrollY > 300) { btn.style.display = "flex"; }
  else { btn.style.display = "none"; }
});
function updateCountdown() {
  const countdownEl = document.getElementById("countdownTimer");
  const sessionDuration = 60;
  const sessionDurationSeconds = sessionDuration * 60;
  const elapsed = Date.now() - sessionStartTime;
  const totalSecondsElapsed = Math.floor(elapsed / 1000);
  const remainingSeconds = sessionDurationSeconds - totalSecondsElapsed;
  if(remainingSeconds >= 0) {
     const remMin = Math.floor(remainingSeconds / 60);
     const remSec = remainingSeconds % 60;
     countdownEl.textContent = "Time Remaining: " + remMin + " min " + remSec + " sec";
  } else { countdownEl.textContent = "Session Complete!"; }
}
function setAnimationIntensity(value) { animationIntensity = value; }
function animateStats() {
  let start = 0;
  const end = totalStudyTime;
  const duration = 1000;
  const increment = end / (duration / 50);
  const counter = setInterval(() => {
    start += increment;
    if(start >= end) { start = end; clearInterval(counter); }
    document.getElementById("timeCount").textContent = Math.floor(start);
  }, 50);
}
function updateXPProgress() {
  const xpPercent = Math.min((xp / xpThreshold) * 100, 100);
  document.getElementById("xpProgressBar").style.width = xpPercent + "%";
}

// NEW: Define updateDailyRoutine to update the daily routine section.
function updateDailyRoutine() {
  const routines = [
    "Focus on Maths for 90 minutes, then review English for 15 minutes.",
    "Spend 30 minutes on IT theory and 300 minutes on Biology.",
    "Review Physics and Chemistry for 90 minutes each.",
    "Combine 100 minutes each of SST, Sanskrit, and Maths.",
    "Mix 30 minutes of Physics, 30 minutes of Chemistry, and 30 minutes of Biology."
  ];
  const randomRoutine = routines[Math.floor(Math.random() * routines.length)];
  document.getElementById("dailyRoutineText").textContent = randomRoutine;
}

// NEW: Prevent accidental navigation away from the site when a study session is running.
window.addEventListener("beforeunload", function (event) {
  if (sessionInterval) {
    event.preventDefault();
    event.returnValue = "A study session is running. Are you sure you want to leave?";
  }
});
