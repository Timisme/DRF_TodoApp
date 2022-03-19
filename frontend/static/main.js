/*
KEY COMPONENTS:
"activeItem" = null until an edit button is clicked. Will contain object of item we are editing
"list_snapshot" = Will contain previous state of list. Used for removing extra rows on list update

PROCESS:
1 - Fetch Data and build rows "buildList()"
2 - Create Item on form submit
3 - Edit Item click - Prefill form and change submit URL
4 - Delete Item - Send item id to delete URL
5 - Cross out completed task - Event handle updated item
NOTES:
-- Add event handlers to "edit", "delete", "title"
-- Render with strike through items completed
-- Remove extra data on re-render
-- CSRF Token
*/
var activeItem = null 
var list_snapshot = []

buildList()

function buildList(){
    let wrapper = document.getElementById('list-wrapper')
    // wrapper.innerHTML = ''
    let url = 'http://127.0.0.1:8000/api/task-list/'

    fetch(url)
    .then((res) => res.json())
    .then(function(data){
        console.log('Data:', data)

        let list = data
        for (let i in list){

            try{
                // 先刪掉該 item 的 div
                document.getElementById(`data-row-${i}`).remove()
            }catch(err){

            }

            let title = `<span class="title">${list[i].title}</span>`

            if (list[i].completed === true){
                title = `<strike class="title">${list[i].title}</strike>`
            } else{
                title = `<span class="title">${list[i].title}</span>`
            }

            // template literal 
            let item = `
                <div id="data-row-${i}" class="task-wrapper flex-wrapper">
                    <div style="flex:7">
                        ${title}
                    </div>
                    <div style="flex:1">
                        <button class="btn btn-sm btn-outline-info edit">Edit </button>
                    </div>
                    <div style="flex:1">
                        <button class="btn btn-sm btn-outline-dark delete">-</button>
                    </div>
                </div>
            `
            //新增該 item 的 div
            wrapper.innerHTML += item
        }

        if (list_snapshot.length > list.length){
            for (let i = list.length; i<list_snapshot.length; i++){
                document.getElementById(`data-row-${i}`).remove()
            }
        }
        list_snapshot = list

        // 對每個 btn 都新增 eventlistener
        // 監聽後function 不帶參數直接呼叫 editItem(list[i]), 會只pass 最後一個 item
        // 用 IIFEs 解決
        for (let i in list){

            let editBtn = document.getElementsByClassName('edit')[i]
            let deleteBtn = document.getElementsByClassName('delete')[i]
            let title = document.getElementsByClassName('title')[i]

            editBtn.addEventListener('click', (function(item){
                return function(){
                    editItem(item)
                }
            })(list[i]))

            deleteBtn.addEventListener('click', (function(item){
                return function(){
                    deleteItem(item)
                }
            })(list[i]))

            title.addEventListener('click', (function(item){
                return function(){
                    strikeUnstrike(item)
                }
            })(list[i]))
        }
    })

}

let form = document.getElementById('form-wrapper')
form.addEventListener('submit', function(e){
    e.preventDefault() // stop the form from submiting 
    var url = 'http://127.0.0.1:8000/api/task-create/'
    let title = document.getElementById('title').value // 取得輸入 title 的值 (DOM)

    if (activeItem !== null){
        var url = `http://127.0.0.1:8000/api/task-update/${activeItem.id}`
        activeItem = null
    }
    
    // API 新增 task 
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            'title': title 
        })
    })
    // api fetch 成功後重新 render 一次頁面
    .then(function(res){
        buildList()
        document.getElementById('form').reset()
    })

})

function editItem(item){
    console.log('Item clicked', item)
    activeItem = item
    document.getElementById('title').value = item.title
}

function deleteItem(item){
    console.log('Item deleted', item)
    fetch(`http://127.0.0.1:8000/api/task-delete/${item.id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        }
    })
    .then((res) => {
        buildList()
    })
}

function strikeUnstrike(item){

    // 每次點擊將 item 的 completed 狀態反轉
    item.completed = !item.completed 

    fetch(`http://127.0.0.1:8000/api/task-update/${item.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            'title': item.title,
            'completed': item.completed,
        })
    })
    .then((res) => {
        buildList()
    })
}