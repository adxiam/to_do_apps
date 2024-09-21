document.getElementById('taskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const task = document.getElementById('taskInput').value;
  
    fetch('/add-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    })
    .then(response => response.json())
    .then(() => {
      loadTasks();
      document.getElementById('taskInput').value = '';
    });
  });
  
  function loadTasks() {
    fetch('/tasks')
      .then(response => response.json())
      .then(tasks => {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
  
        tasks.forEach(task => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${task.task}</span> <button onclick="deleteTask(${task.id})">Delete</button>`;
          taskList.appendChild(li);
        });
  
        updateTaskCounter(tasks.length);
      });
  }
  
  function deleteTask(taskId) {
    fetch('/delete-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    })
    .then(() => loadTasks());
  }
  
  function updateTaskCounter(count) {
    document.getElementById('taskCount').textContent = count;
  }
  
  // Logout
  document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/logout', { method: 'POST' })
      .then(() => window.location.href = 'index.html');
  });
  
  window.onload = loadTasks;
  
