package com.letsgo.devcommunity.domain.member.controller;

import com.letsgo.devcommunity.domain.member.dto.FollowMemberResponse;
import com.letsgo.devcommunity.domain.member.dto.MemberProfileResponse;
import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.member.service.MemberService;
import com.letsgo.devcommunity.global.util.SessionUtils;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/member")
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/{loginId}")
    public MemberProfileResponse getProfile(@PathVariable String loginId) {
        return memberService.getProfile(loginId);
    }

    @PostMapping("/{loginId}/follow")
    public void follow(@PathVariable String loginId, HttpSession session) {
        Member currentMember = SessionUtils.getLoginMember(session);
        memberService.follow(loginId, currentMember.getId());
    }

    @DeleteMapping("/{loginId}/follow")
    public void unfollow(@PathVariable String loginId, HttpSession session) {
        Member currentMember = SessionUtils.getLoginMember(session);
        memberService.unfollow(loginId, currentMember.getId());
    }

    @GetMapping("/{loginId}/followers")
    public List<FollowMemberResponse> getFollowers(@PathVariable String loginId) {
        return memberService.getFollowers(loginId);
    }

    @GetMapping("/{loginId}/followings")
    public List<FollowMemberResponse> getFollowings(@PathVariable String loginId) {
        return memberService.getFollowings(loginId);
    }
}
