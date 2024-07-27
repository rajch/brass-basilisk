'use strict'

function Story () {
    if (!this) {
        return new Story()
    }

    const storyElement = document.querySelector('tw-storydata')
    if (!storyElement) {
        return
    }

    this.storyName = storyElement.getAttribute('name')
    this.startNodePid = storyElement.getAttribute('startnode')
    this.tags = storyElement.getAttribute('tags')?.split(' ')

    this.storyElement = storyElement
    this.contentElement = document.querySelector('section.content')

}

Story.prototype.getPassageByPid = function (id) {
    const passageElement = this.storyElement?.querySelector(`tw-passagedata[pid="${id}"]`)
    if (!passageElement) {
        return
    }

    return getPassageFromElement(passageElement)
}

Story.prototype.getPassageByName = function (name) {
    const passageElement = this.storyElement?.querySelector(`tw-passagedata[name="${name}"]`)
    if (!passageElement) {
        return
    }

    return getPassageFromElement(passageElement)
}

Story.prototype.navigateToPid = function (pid) {
    const passage = this.getPassageByPid(pid)
    passage?.renderHTMLTo(this.contentElement)
}

Story.prototype.navigateToName = function (name) {
    const passage = this.getPassageByName(name)
    passage?.renderHTMLTo(this.contentElement)
}

Story.prototype.Start = function () {
    this.navigateToPid(this.startNodePid)
}

function Passage (id, name, body) {
    if (!this) {
        return new Passage(id, name, body)
    }

    this.pid = id
    this.name = name
    this.body = body

}

Passage.prototype.renderHTMLTo = function (parentElement) {
    parentElement.innerHTML = transformPassageBody(this.body)

    parentElement.querySelectorAll('a[class="link"]')
        .forEach((element) => {
            element.addEventListener('click', linkClickedToNavigate)
        });
}

const getPassageFromElement = (passageElement) => {
    const pid = passageElement.getAttribute('pid')
    const name = passageElement.getAttribute('name')
    const body = passageElement.innerHTML

    return new Passage(pid, name, body)
}

const transformPassageBody = (body) => {
    let bodystr = body

    // Process links
    bodystr = bodystr
        .replace(/\[\[(.*)?-(>|&gt;)(.*)?\]\]/, '<a class="link" data-destination="$3">$1</a>')
        .replace(/\[\[(.*)?(<|&lt;)-(.*)?\]\]/, '<a class="link" data-destination="$1">$3</a>')
        .replace(/\[\[(.*)?\]\]/, '<a class="link" data-destination="$1">$1</a>')

    // Add paragraph tags
    bodystr = bodystr
        .split('\n')
        .map((row) => `<p>${row}</p>`)
        .join('')

    return bodystr
}


const story = new Story()

function linkClickedToNavigate(e) {
    const linkElement = e.target;
    const destPassageName = linkElement.getAttribute('data-destination');
    if(destPassageName) {
        story.navigateToName(destPassageName);
    }
}

story?.Start()