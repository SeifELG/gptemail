document.getElementById('promptForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Show loading indicator and disable the submit button
    const loadingIndicator = document.getElementById('loading');
    const submitButton = this.querySelector('button[type="submit"]');
    loadingIndicator.style.display = 'block';
    submitButton.disabled = true;

    const promptInput = document.getElementById('promptInput').value;
    const prePrompt = ""

    fetch('/proofread', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prePrompt + promptInput }),
    })
        .then(response => response.json())
        .then(data => {
           
            console.log(data)
            const container = document.getElementById('response');
            container.innerHTML = data.parsed
        })
        .catch(error => {
            console.error('Error:', error);
        })
        .finally(() => {
            // Hide loading indicator and re-enable the submit button
            loadingIndicator.style.display = 'none';
            submitButton.disabled = false;
        });
});
