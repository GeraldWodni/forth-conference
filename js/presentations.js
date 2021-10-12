const activePresentation = document.getElementById("active-presentation");

activePresentation.addEventListener("change", evt => {
    console.log( activePresentation.value );
    fetch( `/admin/presentations/set-active/${activePresentation.value}` )
    .then( body => body.json() )
    .then( res => console.log( "RES:", res ) )
    .catch( alert );
});

fetch( `/admin/presentations/get-active` )
.then( body => body.json() )
.then( res => {
    if( res.success )
        activePresentation.value = res.id;
})
.catch( alert );
