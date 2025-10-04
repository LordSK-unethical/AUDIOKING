// Help page functionality
document.addEventListener('DOMContentLoaded', () => {
    const helpMenuItems = document.querySelectorAll('.help-menu-item');
    const helpTopics = document.querySelectorAll('.help-topic');
    const backToHome = document.getElementById('backToHome');

    // Help menu navigation
    helpMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const topic = item.dataset.topic;
            
            // Update active menu item
            helpMenuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding topic
            helpTopics.forEach(t => t.classList.remove('active'));
            const targetTopic = document.getElementById(topic);
            if (targetTopic) {
                targetTopic.classList.add('active');
            }
        });
    });

    backToHome?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
});