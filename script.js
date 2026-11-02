const $ = id => document.getElementById(id);
const modalBackdrop = $("modalBackdrop"), modalContent = $("modalContent");
const STORE = { users:"bp_users", current:"bp_current", results:"bp_results", payments:"bp_payments", enquiries:"bp_enquiries" };
const read = key => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const currentUser = () => { try { return JSON.parse(localStorage.getItem(STORE.current) || "null"); } catch { return null; } };
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function openModal(html){ modalContent.innerHTML=html; modalBackdrop.classList.add("show"); modalBackdrop.setAttribute("aria-hidden","false"); }
function closeModal(){ modalBackdrop.classList.remove("show"); modalBackdrop.setAttribute("aria-hidden","true"); }
$("closeModal").addEventListener("click",closeModal);
modalBackdrop.addEventListener("click",e=>{if(e.target===modalBackdrop)closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("menuToggle").addEventListener("click",()=>{$("mainNav").classList.toggle("open");});
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
document.querySelectorAll(".filter-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");
  document.querySelectorAll(".program-card").forEach(card=>card.classList.toggle("hidden",btn.dataset.filter!=="all"&&card.dataset.group!==btn.dataset.filter));
}));
$("year").textContent=new Date().getFullYear();

function loginModal(tab="login"){
  openModal(`<h2 id="modalTitle">Student portal</h2><p>Sign in or create a student account to view your learning dashboard.</p>
    <div class="modal-tabs"><button class="${tab==="login"?"active":""}" id="loginTab">Login</button><button class="${tab==="register"?"active":""}" id="registerTab">Register</button></div>
    <form id="authForm"><div id="authExtra"></div><label for="authEmail">Email address</label><input id="authEmail" type="email" required placeholder="student@example.com"><label for="authPassword">Password</label><input id="authPassword" type="password" required minlength="4" placeholder="At least 4 characters"><button class="btn btn-primary full" type="submit">${tab==="login"?"Login":"Create account"} ↗</button></form>
    <div class="notice">Demo mode: accounts are stored only in this browser. Do not use real or reused passwords.</div>`);
  $("loginTab").onclick=()=>loginModal("login");$("registerTab").onclick=()=>loginModal("register");
  if(tab==="register")$("authExtra").innerHTML='<label for="authName">Student name</label><input id="authName" required placeholder="Your full name"><label for="authClass">Class</label><select id="authClass" required><option value="">Select class</option>'+Array.from({length:10},(_,i)=>`<option>Class ${i+1}</option>`).join("")+'</select>';
  $("authForm").onsubmit=e=>{
    e.preventDefault();const email=$("authEmail").value.trim().toLowerCase(),password=$("authPassword").value;
    let users=read(STORE.users);
    if(tab==="register"){
      if(users.some(u=>u.email===email)){alert("This email is already registered in this browser.");return;}
      const user={name:$("authName").value.trim(),email, password, studentClass:$("authClass").value,role:"student"};
      users.push(user);write(STORE.users,users);localStorage.setItem(STORE.current,JSON.stringify({name:user.name,email:user.email,studentClass:user.studentClass,role:"student"}));dashboard();
    }else{
      const user=users.find(u=>u.email===email&&u.password===password);
      if(!user){alert("Account not found. Register first or check your details.");return;}
      localStorage.setItem(STORE.current,JSON.stringify({name:user.name,email:user.email,studentClass:user.studentClass,role:user.role||"student"}));dashboard();
    }
  };
}
$("openLogin").onclick=()=>loginModal();
function dashboard(){
  const user=currentUser();if(!user){loginModal();return;}
  const results=read(STORE.results).filter(r=>r.email===user.email),payments=read(STORE.payments).filter(p=>p.email===user.email);
  openModal(`<h2>Welcome, ${escapeHtml(user.name)}!</h2><p>${escapeHtml(user.studentClass||"Academy admin")} · ${escapeHtml(user.email)}</p>
    <div class="dashboard-grid"><div class="dash-tile"><b>${results.length}</b><span>Practice tests taken</span></div><div class="dash-tile"><b>${results.length?Math.max(...results.map(r=>r.score))+"/5":"—"}</b><span>Best test score</span></div><div class="dash-tile"><b>${payments.length}</b><span>Demo fee records</span></div><div class="dash-tile"><b>Active</b><span>Portal account</span></div></div>
    <h3>Your recent test results</h3>${results.length?`<table class="admin-table"><tr><th>Date</th><th>Score</th></tr>${results.slice(-5).reverse().map(r=>`<tr><td>${escapeHtml(r.date)}</td><td>${r.score}/5</td></tr>`).join("")}</table>`:'<p>No test attempts yet. Try the practice test from the home page.</p>'}
    <div class="dash-actions"><button class="secondary-btn" id="dashMaterials">Study materials</button><button class="secondary-btn" id="dashFees">Fee details</button><button class="secondary-btn" id="logoutBtn">Logout</button></div>
    <div class="small-note">Student data in this prototype is saved in this browser only.</div>`);
  $("dashMaterials").onclick=()=>{closeModal();location.hash="#resources";};
  $("dashFees").onclick=feeModal;
  $("logoutBtn").onclick=()=>{localStorage.removeItem(STORE.current);closeModal();};
}
function feeModal(){
  const user=currentUser();if(!user){loginModal();return;}
  const payments=read(STORE.payments).filter(p=>p.email===user.email);
  openModal(`<h2>Fee details</h2><p>Sample fee structure for demonstration. Replace the amount and payment provider with your real setup.</p><div class="dash-tile"><span>Monthly tuition fee</span><b>₹1,500</b><span>Illustrative amount only</span></div><h3 style="margin-top:17px">Payment history</h3>${payments.length?payments.map(p=>`<p>${escapeHtml(p.date)} · ₹${p.amount} · ${escapeHtml(p.status)}</p>`).join(""):"<p>No payment records yet.</p>"}<div class="notice">This demo does not process money. No card, UPI or bank details should be entered here.</div><button class="btn btn-primary full" id="demoPay">Record demo payment status</button>`);
  $("demoPay").onclick=()=>{const list=read(STORE.payments);list.push({email:user.email,amount:1500,date:new Date().toLocaleDateString(),status:"Demo only — not paid"});write(STORE.payments,list);feeModal();};
}
$("openFees").onclick=feeModal;
const questions=[
  {q:"What is 12 × 5?",a:["50","60","65","70"],correct:1},
  {q:"Which planet is known as the Red Planet?",a:["Venus","Jupiter","Mars","Mercury"],correct:2},
  {q:"What is the plural of 'child'?",a:["Childs","Children","Childes","Childrens"],correct:1},
  {q:"How many sides does a hexagon have?",a:["5","6","7","8"],correct:1},
  {q:"Which part of a plant absorbs water?",a:["Flower","Leaf","Root","Stem"],correct:2}
];
$("startTest").onclick=()=>{
  let idx=0,answers=[];
  function render(){
    const q=questions[idx];
    openModal(`<div class="eyebrow">Practice test · Question ${idx+1} of ${questions.length}</div><h2>${q.q}</h2><div class="question">${q.a.map((a,i)=>`<label><input type="radio" name="answer" value="${i}" style="width:auto;margin-right:8px"> ${a}</label>`).join("")}</div><button class="btn btn-primary full" id="nextQuestion">${idx===questions.length-1?"Finish test":"Next question"} →</button><p id="quizError" class="hint"></p>`);
    $("nextQuestion").onclick=()=>{const selected=document.querySelector('input[name="answer"]:checked');if(!selected){$("quizError").textContent="Please choose an answer.";return;}answers.push(Number(selected.value));idx++;if(idx<questions.length)render();else finish();};
  }
  function finish(){
    const score=answers.reduce((sum,a,i)=>sum+(a===questions[i].correct?1:0),0),user=currentUser();
    if(user){const all=read(STORE.results);all.push({email:user.email,score,date:new Date().toLocaleDateString()});write(STORE.results,all);}
    openModal(`<div class="eyebrow">Test completed</div><h2>Your score: ${score}/5</h2><p>${score>=4?"Excellent work! Keep it up.":score>=2?"Good effort. A little more practice will help.":"Keep learning — practice makes progress!"}</p><div class="notice">${user?"Your result has been saved to your student dashboard.":"Login to save your result to your student dashboard."}</div><button class="btn btn-primary full" id="quizDone">Done</button>`);$("quizDone").onclick=closeModal;
  }
  render();
};
$("enquiryForm").onsubmit=e=>{
  e.preventDefault();if(!e.target.reportValidity())return;
  const enquiry={name:$("parentName").value.trim(),studentClass:$("studentClass").value,phone:$("phone").value.trim(),subject:$("subject").value,date:new Date().toLocaleString()};
  const all=read(STORE.enquiries);all.push(enquiry);write(STORE.enquiries,all);
  $("formMessage").textContent="Thank you! Your enquiry is saved in this browser demo.";e.target.reset();
};
function adminLogin(){
  openModal(`<h2>Admin dashboard login</h2><p>Use the demo credentials below to explore the admin panel.</p><label for="adminUser">Username</label><input id="adminUser" value="admin"><label for="adminPass">Password</label><input id="adminPass" type="password" value="admin123"><div class="notice">Demo credentials: admin / admin123. Change and secure these before any real deployment.</div><button class="btn btn-primary full" id="adminEnter">Open admin dashboard ↗</button>`);
  $("adminEnter").onclick=()=>{if($("adminUser").value==="admin"&&$("adminPass").value==="admin123")adminDashboard();else alert("Incorrect demo credentials.");};
}
$("adminLogin").onclick=adminLogin;
function adminDashboard(){
  const users=read(STORE.users),enquiries=read(STORE.enquiries),results=read(STORE.results),payments=read(STORE.payments);
  openModal(`<h2>Admin dashboard</h2><p>BrightPath Academy · Demo overview</p><div class="dashboard-grid"><div class="dash-tile"><b>${users.length}</b><span>Registered students</span></div><div class="dash-tile"><b>${enquiries.length}</b><span>Enquiries saved</span></div><div class="dash-tile"><b>${results.length}</b><span>Test attempts</span></div><div class="dash-tile"><b>${payments.length}</b><span>Demo fee records</span></div></div>
    <h3>Student registrations</h3>${users.length?`<table class="admin-table"><tr><th>Name</th><th>Class</th><th>Email</th></tr>${users.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.studentClass)}</td><td>${escapeHtml(u.email)}</td></tr>`).join("")}</table>`:"<p>No students registered in this browser yet.</p>"}
    <h3 style="margin-top:20px">Recent enquiries</h3>${enquiries.length?`<table class="admin-table"><tr><th>Name</th><th>Class</th><th>Phone</th></tr>${enquiries.slice(-8).reverse().map(q=>`<tr><td>${escapeHtml(q.name)}</td><td>${escapeHtml(q.studentClass)}</td><td>${escapeHtml(q.phone)}</td></tr>`).join("")}</table>`:"<p>No enquiries received yet.</p>"}
    <div class="dash-actions"><button class="secondary-btn" id="exportData">Export data as JSON</button><button class="secondary-btn" id="adminClose">Close</button></div>
    <div class="notice">This is a local prototype. Browser storage is not a secure database and this admin login is not production authentication.</div>`);
  $("adminClose").onclick=closeModal;
  $("exportData").onclick=()=>{const data={users:read(STORE.users).map(({password,...u})=>u),enquiries:read(STORE.enquiries),results:read(STORE.results),payments:read(STORE.payments)};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="brightpath-demo-data.json";a.click();URL.revokeObjectURL(url);};
}
