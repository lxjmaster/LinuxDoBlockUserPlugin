// 初始化屏蔽列表和观察器
let blockedUsers = new Map();
const observer = new MutationObserver(checkNewContent);

// 从存储加载已屏蔽用户
chrome.storage.local.get('blockedUsers', (data) => {
    blockedUsers = new Map(data.blockedUsers || []);
    applyBlocking();
});

// 添加屏蔽按钮
function addBlockButtons() {
    const currentUrl = window.location.href;
    if (currentUrl.startsWith("https://linux.do/t/topic/")) {
        const postAuthor = document.querySelector("article#post_1.boxed.onscreen-post");

        // 查找是否已经存在屏蔽按钮容器
        let blockButtonContainer = document.querySelector("#post_1 > div.topic-map.--op > section > div > div.topic-map__buttons >div.block-user-button");
        if (!blockButtonContainer) {
            // 不存在则创建
            blockButtonContainer = document.createElement("div");
            blockButtonContainer.className = "block-user-button";

            // 按钮span
            const buttonText = document.createElement("span");
            buttonText.className = "d-button-label";
            buttonText.textContent = "屏蔽";

            // 创建按钮
            const blockButton = document.createElement("button");
            blockButton.className = "btn btn-default top-replies";
            blockButton.title = "屏蔽该用户";
            blockButton.type = "button";
            blockButton.appendChild(buttonText);
            blockButton.addEventListener('click', ()=>{console.log("clicked")});

            // 将按钮添加到容器中，再将容器添加到页面上
            blockButtonContainer.appendChild(blockButton);
            document.querySelector("#post_1 > div.topic-map.--op > section > div > div.topic-map__buttons").appendChild(blockButtonContainer);
        }
        if (postAuthor) {
            const author_id = postAuthor.attributes.getNamedItem("data-user-id").value;
        }
    }
}

// 屏蔽点击处理
function handleBlockClick(event) {
    const username = event.target.dataset.username;
    blockedUsers.add(username);
    chrome.storage.local.set({ blockedUsers: [...blockedUsers] });
    applyBlocking();
}

// 应用屏蔽规则
function applyBlocking() {
    document.querySelectorAll('.post, .comment').forEach(post => {
        const username = post.querySelector('.username').textContent.trim();
        post.style.display = blockedUsers.has(username) ? 'none' : '';
    });
}

let debounceTimeout;
// 监听DOM变化
function checkNewContent(mutations) {
    clearTimeout(debounceTimeout);
    debunceTimeout = setTimeout(() => {
        addBlockButtons();
        applyBlocking();
    }, 300);
}

// 启动观察器
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
});

// 初始化执行
addBlockButtons();
applyBlocking();