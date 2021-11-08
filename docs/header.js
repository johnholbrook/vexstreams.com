document.querySelectorAll("#header .nav-link").forEach(link => {
    // console.log(link.href);
    
    if (link.href === window.location.href) {
        link.classList.add("active");
    }
    else if (link.href == `${window.location.href}index.html` && window.location.pathname == "/") {
        link.classList.add("active");
    }
    else{
        link.classList.remove("active");
    }    
});