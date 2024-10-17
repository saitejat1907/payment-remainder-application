document.addEventListener('DOMContentLoaded', function () {
    loadReminders();
  
    document.getElementById('addReminderBtn').addEventListener('click', addReminder);
  });
  
  function addReminder() {
    const reminderMsgInput = document.getElementById('reminderMsg');
    const remindAtInput = document.getElementById('remindAt');
  
    const reminderMsg = reminderMsgInput.value.trim();
    const remindAt = remindAtInput.value.trim().replace('T', ' ');
  
    if (!reminderMsg || !remindAt || new Date(remindAt) <= new Date()) {
      alert('Please enter a valid reminder message and future date/time.');
      return;
    }
  
    const data = {
      reminderMsg,
      remindAt,
    };
  
    fetch('/addReminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log('Reminder added successfully:', result);
        loadReminders();
      })
      .catch((error) => {
        console.error('Error adding reminder:', error);
        alert('Error adding reminder. Please try again.');
      });
  }
  
  function loadReminders() {
    fetch('/getAllReminder')
      .then((response) => response.json())
      .then((data) => {
        const reminderList = document.getElementById('reminderList');
        reminderList.innerHTML = '<h2>Reminder List</h2>';
  
        data.forEach((reminder) => {
          const paragraph = document.createElement('p');
          paragraph.textContent = `${reminder.reminderMsg} - ${new Date(reminder.remindAt).toLocaleString()}`;
          reminderList.appendChild(paragraph);
        });
  
        console.log('Reminders loaded successfully:', data);
      })
      .catch((error) => {
        console.error('Error loading reminders:', error);
      });
  }
  