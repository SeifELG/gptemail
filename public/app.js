document.getElementById('promptForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Show loading indicator and disable the submit button
    const loadingIndicator = document.getElementById('loading');
    const submitButton = this.querySelector('button[type="submit"]');
    loadingIndicator.style.display = 'block';
    submitButton.disabled = true;

    const promptInput = document.getElementById('promptInput').value;

    // pass these in as system prompts rather than preprompts?

    // const prePrompt = "Below is an exerpt from a textbook. Convert the text into bulletpoint form. \n\n"
    // const prePrompt = "Below is an exerpt from a textbook. Give me a one line summary of what it is about. \n\n"
    // const prePrompt = "Below is an exerpt from a textbook. Give me all the keywords and concepts covered here. \n\n"
    // const prePrompt = "Below is an exerpt from a textbook. Conver this text into a mnemonic medium. This means returning question and answer pairs. The answers should be very short (a word or two) and specific. You can cover the same area with multiple questions. \n\n"
    const prePrompt = ""

    fetch('/to-questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prePrompt + promptInput }),
    })
        .then(response => response.json())
        .then(data => {
            // const contentString = data.choices[0].message.content;
            document.getElementById('response').innerHTML = data;
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
