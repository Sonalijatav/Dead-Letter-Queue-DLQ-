# Dead-Letter-Queue-DLQ-
Dead Letter Queue (DLQ) 



# QueueCTL - Background Job Queue System

A CLI-based job queue system built with **Node.js**, **MongoDB**, and **worker processes**. This tool allows you to enqueue background jobs, process them using multiple workers, retry failed jobs with exponential backoff, and manage Dead Letter Queue (DLQ) jobs.

---

## 🚀 Features

* CLI to enqueue and manage jobs
* Multiple worker processes
* Automatic retries with exponential backoff
* Dead Letter Queue (DLQ) for permanently failed jobs
* Persistent job storage using MongoDB
* Safe job locking to avoid duplicate processing
* Dynamic job commands passed via JSON
* Configurable retry limits and backoff base
* Completely file-based enqueue for Windows compatibility

---

## 📦 Tech Stack

* **Node.js** (CLI + Worker Engine)
* **MongoDB** (Persistent Job Storage)
* **Yargs** (CLI Parsing)
* **Child Process** (Job Command Execution)

---

# 📁 Project Structure

```
queuectl/
├── bin/
│   └── queuectl            # CLI tool
├── src/
│   ├── cli.js              # CLI handler
│   ├── worker_process.js   # Worker engine
│   ├── queue.js            # Queue management logic
│   ├── db.js               # MongoDB connection + Job model
│   ├── config.js           # Config (retry base, DB URL)
├── job.json                # Example job
├── job2.json               # Example job
├── package.json
└── README.md
```

---

# 🛠 Installation & Setup

Open PowerShell and navigate to the project:

```powershell
cd C:\Users\DELL\Downloads\queuectl_node_mongo_filezip
npm install
```

Ensure MongoDB is running:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

---

# ⚙️ Running the Worker

### Start first worker (Terminal #1)

```powershell
node .\src\worker_process.js 1
```

You will see:

```
[worker] worker-1 started
```

Leave this running.

### Start multiple workers

Open more terminals:

```powershell
node .\src\worker_process.js 1
node .\src\worker_process.js 2
node .\src\worker_process.js 3
```

Workers safely share workload.

---

# 📥 Enqueue Jobs (Terminal #2)

### Enqueue job using JSON file

```powershell
node .\bin\queuectl enqueue --file job.json
```

### Example `job.json`:

```json
{
  "command": "node -e \"setTimeout(()=>console.log('job: hello'),2000)\"",
  "max_retries": 2
}
```

### Another job

```powershell
node .\bin\queuectl enqueue --file job2.json
```

Output:

```
Enqueued job <job-id>
```

---

# 📊 Checking Status

### Overall Job Summary

```powershell
node .\bin\queuectl status
```

---

# 📃 Listing Jobs

### All jobs

```powershell
node .\bin\queuectl list
```

### Pending jobs

```powershell
node .\bin\queuectl list --state pending
```

### Completed jobs

```powershell
node .\bin\queuectl list --state completed
```

### Failed jobs

```powershell
node .\bin\queuectl list --state failed
```

### Dead jobs (DLQ)

```powershell
node .\bin\queuectl list --state dead
```

---

# 🟥 Dead Letter Queue (DLQ)

PowerShell sometimes interferes with nested CLI commands, so these **safe Node commands** work everywhere.

### List DLQ jobs

```powershell
node -e 'require("./src/db").connect(require("./src/config").MONGODB_URI).then(async ()=>{ const Job=require("./src/db").models.Job; const list=await Job.find({state:"dead"}).lean(); if(!list.length){ console.log("No DLQ jobs"); process.exit(0);} console.table(list.map(j=>({ id:j.id, attempts:j.attempts, last_error:j.last_error, command:j.command }))); process.exit(0); })'
```

### Retry a DLQ job

Replace `JOB_ID_HERE`:

```powershell
node -e 'require("./src/db").connect(require("./src/config").MONGODB_URI).then(async ()=>{ const q=require("./src/queue"); await q.retryDeadJob("JOB_ID_HERE"); console.log("DLQ job retried:", "JOB_ID_HERE"); process.exit(0); })'
```

---

# 🔁 Reset a Job to Pending

Reset job attempts and allow worker to retry.
Replace `<JOB_ID>`:

```powershell
node -e 'require("./src/db").connect(require("./src/config").MONGODB_URI).then(async ()=>{ const Job=require("./src/db").models.Job; await Job.updateOne({id:"<JOB_ID>"},{$set:{state:"pending",attempts:0,next_run_at:new Date(),updated_at:new Date(),last_error:null}}); console.log("reset done"); process.exit(0); })'
```

---

# 🛠 Debug Commands

### Show configuration

```powershell
node -e "console.log(require('./src/config'))"
```

### View most recent job

```powershell
node -e 'require("./src/db").connect(require("./src/config").MONGODB_URI).then(async ()=>{ const Job=require("./src/db").models.Job; const j=await Job.findOne({}).sort({created_at:-1}).lean(); console.log(j); process.exit(0); })'
```

### Force all jobs to retry now

```powershell
node -e 'require("./src/db").connect(require("./src/config").MONGODB_URI).then(async ()=>{ const Job=require("./src/db").models.Job; await Job.updateMany({},{$set:{next_run_at:new Date()}}); console.log("next_run_at reset"); process.exit(0); })'
```

---

# 🔧 Job Lifecycle

| State      | Description                        |
| ---------- | ---------------------------------- |
| pending    | Waiting to be picked by a worker   |
| processing | Currently being executed           |
| completed  | Successfully executed              |
| failed     | Temporary failure, retry scheduled |
| dead       | Permanently failed → moved to DLQ  |

Jobs automatically retry with exponential backoff:

```
delay = base ^ attempts
```

(Default base = 2)

---

# 🎯 Requirements Achieved

* ✔ Background workers
* ✔ CLI interface
* ✔ Persistent MongoDB storage
* ✔ Retry with exponential backoff
* ✔ Dead Letter Queue
* ✔ Multiple workers
* ✔ Job locking to prevent duplicates
* ✔ Configurable retry + backoff
* ✔ Real command execution via child_process
* ✔ Fully dynamic jobs via JSON

---

# 🎥 Demo Instructions

1. Start MongoDB
2. Start worker in Terminal #1
3. Enqueue jobs from Terminal #2
4. Show job status, list, failures
5. Demonstrate DLQ retry
6. Demonstrate multiple workers

---


---

# 👨‍💻 Author

**Sonali**
