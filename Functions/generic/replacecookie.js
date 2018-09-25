function replaceCookie(name, value, days){
    deleteCookie(name);
    setCookie(name, value, days);
}