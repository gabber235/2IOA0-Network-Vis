
export function handleDefaultScroll() {
    const scroll = document.querySelectorAll<HTMLElement>(".js-scroll")
    scroll.forEach(element => element.style.opacity = "0")
    handleScrollAnimaton(scroll, 0)
}

const elementInView = (el: Element, scrollOffset = 0) => {
    const elementTop = el.getBoundingClientRect().bottom;

    return (
        elementTop <=
        ((window.innerHeight || document.documentElement.clientHeight) - scrollOffset)
    );
};

const displayScrollElement = (element: Element) => {
    element.classList.add("scrolled");
};

/**
 * Handle scroll triggers. If onExit is specified, onView and onExit will be triggered wen one or multiple elements enter or exit the view.
 * If onExit is not specified it will only once trigger onView.
 * 
 * @param elements Element or elements that have an action applied on scroll in or exit.
 * @param scrollOffset The offset from the bottom of the element when it needs to be animated from.
 * @param onView Ran if the element has come in to view.
 * @param onExit Ran if the element has left the view.
 */
export function handleScrollAnimaton(elements: Element | NodeListOf<Element>, scrollOffset = 0, onView: (element: Element) => any = displayScrollElement, onExit: (element: Element) => any = null) {
    const handle = (el: Element, lastInView: boolean): boolean => {
        const inView = elementInView(el, scrollOffset)
        if (inView && !lastInView) {
            onView(el)
            return true
        } else if (!inView && lastInView && onExit !== null) {
            onExit(el)
            return false
        }
        return lastInView
    }

    if (elements instanceof Element) {
        let lastInView = false
        window.addEventListener('scroll', () => {
            lastInView = handle(elements, lastInView);
        })
    } else {
        elements.forEach(element => handleScrollAnimaton(element, scrollOffset, onView, onExit))
    }
}