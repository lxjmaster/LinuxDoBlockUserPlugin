// 初始化屏蔽列表和观察器
let blockedUsers = new Map();
const observer = new MutationObserver(checkNewContent);
let currentUserName = null;

// 查询当前登录用户
function findCurrentUser() {
    document.querySelectorAll("ul#sidebar-section-content-community > li.sidebar-section-link-wrapper").forEach(element => {
        const itemName = element.attributes.getNamedItem("data-list-item-name");
        if (itemName && itemName.value === "my-posts") {
            const activeUrl = element.querySelector("a").href;
            currentUserName = activeUrl.split("/").slice(-2, -1)[0];

            return currentUserName;
        }
    });

    return null;
}

// 从存储加载已屏蔽用户
chrome.storage.local.get('blockedUsers', (data) => {
    blockedUsers = new Map(data.blockedUsers || []);
    applyBlocking();
});

// 添加屏蔽按钮
function addBlockButtons() {
    let authorId = null;
    let authorName = null;
    let authorAvatar = null;

    if (!currentUserName) {
        currentUserName = findCurrentUser();
    }

    const currentUrl = window.location.href;
    if (currentUrl.startsWith("https://linux.do/t/topic/")) {
        const postAuthor = document.querySelector("article#post_1.boxed.onscreen-post");
        if (postAuthor) {
            authorId = postAuthor.attributes.getNamedItem("data-user-id").value;
            const authorNameEle = postAuthor.querySelector(".row > .topic-avatar > .post-avatar > a")
            authorName = authorNameEle ? authorNameEle.attributes.getNamedItem("data-user-card").value : null;

            // 如果是自己的帖子，则不添加屏蔽按钮
            if (currentUserName && authorName === currentUserName) {
                return;
            }

            const authorAvatarEle = authorNameEle.querySelector("img");
            authorAvatar = authorAvatarEle ? "https://linux.do" + authorAvatarEle.attributes.getNamedItem("src").value : null;
        }

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
            blockButton.dataset.id = authorId || null;
            blockButton.dataset.avatar = authorAvatar || null;
            blockButton.dataset.name = authorName || null;
            blockButton.appendChild(buttonText);
            blockButton.addEventListener('click', handleBlockClick);

            // 将按钮添加到容器中，再将容器添加到页面上
            blockButtonContainer.appendChild(blockButton);
            document.querySelector("#post_1 > div.topic-map.--op > section > div > div.topic-map__buttons").appendChild(blockButtonContainer);
        }

        // 更新屏蔽按钮状态
        const blockButton = blockButtonContainer.querySelector("button");
        if (blockedUsers.has(authorName)) {
            blockButton.querySelector("span").textContent = "取消屏蔽";
            blockButton.title = "取消屏蔽该用户";
            blockButton.addEventListener('click', handleUnBlockClick)
        }
    }
}

// 屏蔽点击处理
function handleBlockClick(event) {
    const userId = event.currentTarget.dataset.id;
    const userAvatar = event.currentTarget.dataset.avatar;
    const userName = event.currentTarget.dataset.name;
    if (userId && userAvatar && userName) {
        if (!blockedUsers.has(userName)) {
            blockedUsers.set(userName, { id: userId, avatar: userAvatar, name: userName });
            chrome.storage.local.set({ blockedUsers: [...blockedUsers] });
            applyBlocking();
            event.target.textContent = "取消屏蔽";
        }
    }
}

// 取消屏蔽点击处理
function handleUnBlockClick(event) {
    const userName = event.currentTarget.dataset.name;
    if (userName) {
        blockedUsers.delete(userName);
        chrome.storage.local.set({ blockedUsers: [...blockedUsers] });
        applyBlocking();
        event.target.textContent = "屏蔽";
    }
}

// 应用屏蔽规则
function applyBlocking() {
    // 隐藏已屏蔽用户的帖子
    document.querySelectorAll("tbody.topic-list-body > tr").forEach(element => {
        const postAuthor = element.querySelector("td.posters.topic-list-data > a")
        const userName = postAuthor ? postAuthor.attributes.getNamedItem("data-user-card").value : null;
        if (blockedUsers.has(userName)) {
            element.style.display = "none";
        }
    });

    // 隐藏已屏蔽用户的评论
    document.querySelectorAll("article").forEach(element => {
        const userName = element.querySelector(".row > .topic-avatar > .post-avatar > a").attributes.getNamedItem("data-user-card").value;
        if (blockedUsers.has(userName)) {
            if (element.id !== "post_1") {
                element.parentElement.style.display = "none";
            }
        }
    });
}

let debounceTimeout;
// 监听DOM变化
function checkNewContent(mutations) {
    clearTimeout(debounceTimeout);
    debunceTimeout = setTimeout(() => {
        addBlockButtons();
        applyBlocking();
    }, 2000);
}

// 启动观察器
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
});

// 初始化执行
findCurrentUser();
addBlockButtons();
applyBlocking();