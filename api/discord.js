require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
// const btoa = require("btoa");
const { 
    catchAsync, getGuildIcon, getBasicAuth, tokenAuth
} = require("../functions");

const CLIENT_ID = process.env.CLIENT_ID;
    CLIENT_SECRET = process.env.CLIENT_SECRET,
    PORT = process.env.PORT,
    BASE_REDIRECT = process.env.BASE_REDIRECT,
    REDIRECT_URI = BASE_REDIRECT+":" + PORT + "/api/discord/callback";
router.get("/login", (req, res) => {
    res.redirect(
        `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify guilds&response_type=code&redirect_uri=${REDIRECT_URI}`
        //https://discord.com/api/oauth2/authorize?client_id=911230871393144832&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fdiscord%2Fcallback&response_type=code&scope=identify
    );
});

router.get(
    "/callback",
    catchAsync(async (req, res) => {
        if (!req.query.code) throw new Error("NoCodeProvided");
        // console.log(req.query.code)
        const code = req.query.code;
        // console.log("Code:", code, CLIENT_ID, CLIENT_SECRET);

        // Basic Authentication for token request
        // ####
        let basicAuth = await getBasicAuth(CLIENT_ID, CLIENT_SECRET, code, REDIRECT_URI)
        if (basicAuth.error != null) return res.redirect("/error");
        else basicAuth = basicAuth.res;

        const basicAuthData = await basicAuth.json();
        // ####
        
        // Token Authentication for Discord User Infos
        // ###
        let user_infos_nojson = await tokenAuth("https://discord.com/api/users/@me", basicAuthData.token_type, basicAuthData.access_token )
        if (user_infos_nojson.error != null) return res.redirect("/error");
        else user_infos_nojson = user_infos_nojson.res;
        
        const user_infos = await user_infos_nojson.json();
        req.session.discord = {};
        req.session.discord.userInfo = user_infos;
        // ###

        // Token Authentication for Discord User Partecipating Guilds
        // ##
        let user_guilds_nojson = await tokenAuth("https://discord.com/api/users/@me/guilds", basicAuthData.token_type, basicAuthData.access_token )
        if (user_guilds_nojson.error != null) return res.redirect("/error");
        else user_guilds_nojson = user_guilds_nojson.res;
        
        const user_guilds = await user_guilds_nojson.json();
        req.session.discord.userGuilds = user_guilds;
        req.session.discord.guildsCounter = Object.keys(user_guilds).length;
        // ##

        // console.log(user_guilds[0])
        // const t = await fetch(
        //     "https://discordapp.com/guilds/"+user_guilds[0].id,
        //     {
        //         method: "GET",
        //         headers: {
        //             'Cache-Control': 'no-cache',
        //             'Content-Type': 'application/x-www-form-urlencoded',
        //             authorization: `${responsejson.token_type} ${responsejson.access_token}`,
        //         },
        //     }
        // )
        // console.log( await t.json())
        await getGuildIcon(user_guilds[0].id, user_guilds[0].icon )

        res.redirect(`/servers`);
    })
);

module.exports = router;
