package com.letsgo.devcommunity.domain.post.controller;

import com.letsgo.devcommunity.domain.post.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommentController {
    private final PostService postService;

    @Autowired
    public CommentController(PostService postService){
        this.postService = postService;
    }

    @DeleteMapping("/comment/{commentId}")
    public void deleteComment(@PathVariable("commentId") Long id) {
        postService.deleteComment(id);
    }
}
