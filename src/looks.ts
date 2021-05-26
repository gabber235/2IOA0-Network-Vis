
/**
 * Adds some aesthetic flourish to a given file input element
 */
export function prettifyFileInput(elm: HTMLElement) {
    elm.addEventListener('change', (event: any) => {
        const fileList: FileList = event.target.files;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList.item(i);

            const label = elm.nextElementSibling;
            label.innerHTML = file.name
        }
    })
}