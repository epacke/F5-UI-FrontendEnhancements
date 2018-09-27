function matchCertAndKey(){

    $('select#chain').val(defaultChain)

    $('select#cert').on("change", function(){

        certName = $(this).val();
        probableKeyName = certName.replace(/\.crt$/, ".key");

        $('select#key').val(probableKeyName);

        if(defaultChain !== ""){
            $('select#chain').val(defaultChain)
        }

    });
}