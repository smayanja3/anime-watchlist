const editForm = document.querySelector('#editForm')
const deleteBtn = document.querySelector('#deleteBtn')

  
// ---------------------- EDIT FORM  ----------------------//
//------- PUT/ UPDATE
if (editForm) {

    editForm.addEventListener('submit', function (event) {
        event.preventDefault() // stops the page from reloading before the fetch finishes
        const form = document.getElementById('editForm')
        const id = form.dataset.id // this is the anime id from data-id on the edit form

        const updatedAnime = {
            title: document.querySelector('[name="title"]').value,
            type: document.querySelector('[name="type"]').value,
            season: document.querySelector('[name="season"]').value,
            totalEpisodes: document.querySelector('[name="totalEpisodes"]').value,
            episodesWatched: document.querySelector('[name="episodesWatched"]').value,
            status: document.querySelector('[name="status"]').value,
            rating: document.querySelector('[name="rating"]').value,
            notes: document.querySelector('[name="notes"]').value,
        }

        console.log('sending', id, updatedAnime)

        fetch(`/watchlist/${id}`, {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAnime)
        })

            .then(res => {
                console.log('server answered:', res.status, res.ok)
                if (res.ok) {
                    window.location.href = `/watchlist/${id}` // go to ONE show page
                } else {
                    return res.json().then(data => {
                        document.getElementById('error-message').innerText = data.error
                    })
                }
            })


    })
}

// ---------------------- DELETE  ----------------------//
//------- DELETE/REMOVE

if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
        const sure = confirm('Delete this anime from your watchlist?')

        if (!sure) return // <-- another pop up im thinkin Clicked cancel so STOP

        const id = this.dataset.id

        console.log('deleting', id)

        fetch(`/watchlist/${id}`, {
            method: 'delete'
        })
            .then(res => {
                console.log('server approved:', res.status, res.ok)
                if (res.ok) {
                    window.location.href = ('/watchlist') // <- back to the watchlist show should be gone now
                } else {
                    return res.json().then(data => {
                        document.getElementById('error-message').innerText = data.error
                    })
                }
            })
    })
}