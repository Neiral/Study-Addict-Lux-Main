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
        "They love your presence, but not your name, study hard and change the game.",
        "You're their last thought, their aftertaste, work in silence, leave no waste.",
        "You text, they see, they never reply, rise so high they choke on their lie.",
        "You're an option, a plan gone wrong, be their regret, prove them strong.",
        "No one stays, no one calls, build your throne or watch it fall.",
        "They loved the power, not the face, become the fire, leave no trace.",
        "They whisper your name like it’s a joke, make them beg with every stroke.",
        "They moved on, they found their best, now leave them stunned, leave them pressed.",
        "You begged for love, they gave you air, now own the world, make them stare.",
        "Ignored today, forgotten tomorrow, but study now, erase the sorrow.",
        "You're the message left on read, burn your pain, rise from the dead.",
        "They don’t love, they just use, study now, refuse to lose.",
        "A loser waits, a winner grinds, so prove them wrong, rewrite their minds.",
        "You're their second, not their first, be their nightmare, not their thirst.",
        "You're their silence, not their sound, make them miss what can’t be found.",
        "They replaced you overnight, study now, win the fight.",
        "You're a face, not a name, make them cry in silent shame.",
        "They never thought you'd be the king, now let success be your sting.",
        "They laughed, they left, they shut you out, now be the name they cry about.",
        "You chase their love, they chase their dreams, wake up now, tear the seams.",
        "You're a shadow, not the sun, grind in silence, be the one.",
        "They won’t text, they won’t care, study hard, make them stare.",
        "You're a ghost in their mind, leave them breathless, leave them blind.",
        "You're the chapter they skipped to read, now be the story they beg to need.",
        "No one stays, no one waits, rise above or share their fate.",
        "You're the game they chose to quit, now be the player they can’t forget.",
        "They won’t miss you till you shine, build your empire, make it fine.",
        "You're the ‘maybe,’ not the ‘must,’ turn your pain into their dust.",
        "They found better, they let you go, now be the fire, let them know.",
        "You’re the past, not the now, make them wish they knew you how.",
        "You're their option, not their goal, now make them beg to sell their soul.",
        "No one saves, no one waits, grab your dreams, rewrite your fate.",
        "You were the joke, you were the fool, now be the king, make the rules.",
        "You're forgotten, lost, replaced, study now, leave them faced.",
        "They never cared, they never cried, now be the storm they can’t deny.",
        "You were dust beneath their feet, now rise like fire, make them weep.",
        "You're the door they left behind, now be the lock they’ll never find.",
        "They loved the thrill, not the pain, now be the one they crave again.",
        "You chased them down, they walked away, now let success make them stay.",
        "You’re the silence in their night, be the echo, burn so bright.",
        "They loved, they left, they found their way, now let them wish you never strayed.",
        "You're the memory they forgot, be the lesson they never thought.",
        "They picked another, let you go, now be the name they’ll never know.",
        "You cried, they smiled, they moved ahead, now study hard, leave them dead.",
        "You're the backup, not the prize, turn your wounds into their cries.",
        "They don’t call, they don’t see, but when you shine, they’ll beg to be.",
        "You're the extra, not the core, grind in silence, be their war.",
        "They never needed, never tried, now let them watch you touch the sky."
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
