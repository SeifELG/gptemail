document.getElementById('promptForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Show loading indicator and disable the submit button
    const loadingIndicator = document.getElementById('loading');
    const submitButton = this.querySelector('button[type="submit"]');
    loadingIndicator.style.display = 'block';
    submitButton.disabled = true;

    const promptInput = document.getElementById('promptInput').value;
    // const password = document.getElementById('password').value;
    // const isGPT4 = document.getElementById('isGPT4').checked;

    fetch('/proofread', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt:promptInput }),
    })
        .then(response => response.json())
        .then(data => {
           
            // console.log(isGPT4)
            // console.log(password)
            console.log(data)
            const responseDiv = document.getElementById('response');
            const diffDiv = document.getElementById('diff');
            responseDiv.innerHTML = data.parsed;
            diffDiv.innerHTML = data.diff;
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
