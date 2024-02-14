let rightContent = document.querySelector('.home-right');
console.log(rightContent.innerHTML);

let header = document.querySelector('.home-header');
    if(header.style.width < "800px") {
        rightContent.innerHTML = 
        `
        <select name="<i class='fa-solid fa-bars'></i>" id="">
            <option value="">MENU</option>
            <option value=""><a href="">Library</a></option>
            <option value=""><a href="">about us</a></option>
            <option value=""><a href="">contacts</a></option>
        </select>
        `
    }